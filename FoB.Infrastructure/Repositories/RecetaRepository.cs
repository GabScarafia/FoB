using FoB.Application.Entities.Receta;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace FoB.Infrastructure.Repositories;

internal sealed class RecetaRepository : IRecetaRepository
{
    private readonly fobContext _context;
    private readonly ICurrentUser _currentUser;
    public RecetaRepository(fobContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<bool> CreateAsync(RecetaRequest receta)
    {
        Receta nuevaReceta = new()
        {
            Titulo = receta.Titulo,
            Descripcion = receta.Descripcion,
            Activa = true,
            UsuarioId = _currentUser.User.Id,
            Estado = EstadoEnum.Revision.ToString(),
            Dificultad = receta.Dificultad.ToString(),
            FechaCreacion = DateTime.Now,
            RecetaImagen = [ new RecetaImagen
            {
                Imagen = receta.Imagen,
            }],
        };
        if (receta.TiempoPreparacion.HasValue)
            nuevaReceta.TiempoPreparacion = TimeOnly.FromTimeSpan(TimeSpan.FromMinutes(receta.TiempoPreparacion.Value));

        List<IngredienteReceta> ingredienteRecetas = new();
        if(receta.Ingredientes != null && receta.Ingredientes.Count > 0)
        {
            foreach (var item in receta.Ingredientes)
            {
                var ingrediente = await IngredienteCreateIfNotExist(item); 
                IngredienteReceta ingredienteReceta = new()
                {
                    IngredienteId = ingrediente.Id,
                    UnidadDeMedida = item.UnidadDeMedida,
                    Cantidad = item.Cantidad,
                };
                ingredienteRecetas.Add(ingredienteReceta);
            }
            nuevaReceta.IngredienteReceta = ingredienteRecetas;
        }

        List<RecetaCategoria> categoriaRecetas = new();
        if (receta.Categorias != null && receta.Categorias.Count > 0)
        {
            foreach (var item in receta.Categorias)
            {
                var categoria = await CategoriaCreateIfNotExist(item);
                RecetaCategoria categoriaReceta = new()
                {
                    CategoriaId = categoria.Id
                };
                categoriaRecetas.Add(categoriaReceta);
            }
            nuevaReceta.IngredienteReceta = ingredienteRecetas;
        }
        await _context.Set<Receta>().AddAsync(nuevaReceta);
        await _context.SaveChangesAsync();

        return true;
    }

    private async Task<Ingrediente> IngredienteCreateIfNotExist(IngredienteRecetaRequest ingredienteRecetaRequest)
    {
        var ig = await _context.Set<Ingrediente>().FirstOrDefaultAsync(x=>x.Id == ingredienteRecetaRequest.Id || x.Nombre == ingredienteRecetaRequest.Nombre );
        if (ig != null)
            return ig;
        else
        {
            ig = new Ingrediente() { Nombre = ingredienteRecetaRequest.Nombre, Descripcion = ingredienteRecetaRequest.Descripcion};
            await _context.Set<Ingrediente>().AddAsync(ig);
            await _context.SaveChangesAsync();
            return ig;
        }    
    }
    private async Task<Categoria> CategoriaCreateIfNotExist(CategoriaRequest categoriaRequest)
    {
        var categoria = await _context.Set<Categoria>().FirstOrDefaultAsync(x => x.Id == categoriaRequest.Id || x.Nombre == categoriaRequest.Nombre);
        if (categoria != null)
            return categoria;
        else
        {
            categoria = new Categoria() { Nombre = categoriaRequest.Nombre, Descripcion = categoriaRequest.Descripcion };
            await _context.Set<Categoria>().AddAsync(categoria);
            await _context.SaveChangesAsync();
            return categoria;
        }
    }

    public async Task<IEnumerable<RecetaResponse>> TendenciasAsync(int pageNumber = 1)
    {
        int pageSize = 10;
        IQueryable<Receta> query = _context.Set<Receta>()
            .Include(x => x.Usuario)
                 .ThenInclude(x => x.UsuarioImagen)
            .Include(x => x.RecetaImagen)
            .Include(x => x.Voto)
            .Include(x => x.Comentario)
            .Include(x => x.IngredienteReceta)
                .ThenInclude(x => x.Ingrediente)
            .Include(x => x.RecetaCategoria)
                .ThenInclude(x => x.Categoria)
            .Where(x => x.Activa == true /*&& x.Estado == EstadoEnum.Aprobada.ToString()*/);

        // Sort by creation date (desc) and then by average rating (desc)
        query = query.OrderByDescending(x => x.FechaCreacion.Date)
                     .ThenByDescending(x => x.PuntuacionPromedio);

        // Pagination
        query = query.Skip((pageNumber - 1) * pageSize).Take(pageSize);

        var list = await query.Select(x => new RecetaResponse
        {
            Id = x.Id,
            Titulo = x.Titulo,
            Descripcion = x.Descripcion,
            Dificultad = x.Dificultad,
            CantidadVotos = x.Voto.Count(),
            CantidadComentarios = x.Comentario.Count(),
            Estado = x.Estado,
            Imagen = x.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen,
            FechaCreacion = x.FechaCreacion,
            MeGusta = x.Voto.Any(x=>x.UsuarioId == _currentUser.User.Id),
            FechaModificacion = x.FechaModificacion,
            PuntuacionPromedio = x.PuntuacionPromedio,
            TiempoPreparacion = x.TiempoPreparacion.HasValue ? x.TiempoPreparacion.Value.ToTimeSpan() : null,
            Autor = new UsuarioResponse
            {
                Id = x.Usuario.Id,
                Imagen = x.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen,
                NombreUsuario = x.Usuario.NombreUsuario,
                Nombre = x.Usuario.Nombre,
                Apellido = x.Usuario.Apellido,
            },
            Ingredientes = x.IngredienteReceta.Select(i => new IngredienteResponse
            {
                Id = i.IngredienteId,
                Nombre = i.Ingrediente.Nombre,
                Cantidad = i.Cantidad,
                UnidadDeMedida = i.UnidadDeMedida
            }).ToList(),
            Categorias = x.RecetaCategoria.Select(c => c.Categoria.Nombre).ToList()
        })
        .ToListAsync();

        return list;
    }

    public async Task<IEnumerable<RecetaResponse>> FeedAsync(int pageNumber = 1)
    {
        int pageSize = 10;
        var currentUserId = _currentUser.User.Id;

        // 1. Obtiene los IDs de los usuarios que el usuario actual sigue.
        // Esta es la forma más directa y eficiente de hacerlo.
        var followedUserIds = await _context.Set<SeguimientoUsuario>()
                                            .Where(s => s.SeguidorId == currentUserId)
                                            .Select(s => s.SeguidoId)
                                            .ToListAsync();
        //Para que aparezcan las tuyas
        followedUserIds.Add(currentUserId);
        // 2. Si la lista de seguidos está vacía, devuelve una lista vacía de publicaciones.
        if (!followedUserIds.Any())
        {
            return new List<RecetaResponse>();
        }

        // 3. Obtiene las publicaciones de los usuarios seguidos, incluyendo todas las relaciones necesarias.
        var query = _context.Set<Receta>()
                            .Include(x => x.Usuario)
                                .ThenInclude(x => x.UsuarioImagen)
                            .Include(x => x.RecetaImagen)
                            .Include(x => x.Voto)
                            .Include(x => x.Comentario)
                                .ThenInclude(x => x.Usuario) // Incluye el usuario del comentario para la vista previa
                            .Include(x => x.IngredienteReceta)
                                .ThenInclude(x => x.Ingrediente)
                            .Include(x => x.RecetaCategoria)
                                .ThenInclude(x => x.Categoria)
                            .Where(x => x.Activa == true && followedUserIds.Contains(x.UsuarioId));

        // Ordena por fecha de creación de forma descendente.
        query = query.OrderByDescending(x => x.FechaCreacion);

        // Aplica la paginación.
        query = query.Skip((pageNumber - 1) * pageSize).Take(pageSize);

        // 4. Mapea la consulta a la respuesta y la ejecuta.
        var list = await query.Select(x => new RecetaResponse
        {
            Id = x.Id,
            Titulo = x.Titulo,
            Descripcion = x.Descripcion,
            Dificultad = x.Dificultad,
            CantidadVotos = x.Voto.Count(),
            MeGusta = x.Voto.Any(v => v.UsuarioId == currentUserId),
            CantidadComentarios = x.Comentario.Count(),
            VistaPreviaComentarios = x.Comentario.OrderByDescending(c => c.Fecha).Take(3)
                                                .Select(c => new ComentarioResponse
                                                {
                                                    Id = c.Id,
                                                    Texto = c.Texto,
                                                    Fecha = c.Fecha,
                                                    Autor = new UsuarioResponse
                                                    {
                                                        Id = c.Usuario.Id,
                                                        NombreUsuario = c.Usuario.NombreUsuario,
                                                        Nombre = c.Usuario.Nombre,
                                                        Apellido = c.Usuario.Apellido,
                                                        Imagen = c.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen,
                                                    }
                                                }).ToList(),
            Estado = x.Estado,
            FechaCreacion = x.FechaCreacion,
            FechaModificacion = x.FechaModificacion,
            PuntuacionPromedio = x.PuntuacionPromedio,
            Imagen = x.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen,
            TiempoPreparacion = x.TiempoPreparacion.HasValue ? x.TiempoPreparacion.Value.ToTimeSpan() : null,
            Autor = new UsuarioResponse
            {
                Id = x.Usuario.Id,
                NombreUsuario = x.Usuario.NombreUsuario,
                Nombre = x.Usuario.Nombre,
                Apellido = x.Usuario.Apellido,
                Imagen = x.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen,
            },
            Ingredientes = x.IngredienteReceta.Select(i => new IngredienteResponse
            {
                Id = i.IngredienteId,
                Nombre = i.Ingrediente.Nombre,
                Cantidad = i.Cantidad,
                UnidadDeMedida = i.UnidadDeMedida
            }).ToList(),
            Categorias = x.RecetaCategoria.Select(c => c.Categoria.Nombre).ToList()
        })
        .ToListAsync();

        return list;
    }

    public async Task<bool> EstaSiguiendoAlguienAsync()
    {
        return await _context.Set<SeguimientoUsuario>()
            .AnyAsync(s => s.SeguidorId == _currentUser.User.Id);
    }

    public async Task<bool> LikeOrDislike(int idReceta)
    {
        var idUsuario = _currentUser.User.Id;
        var votoExistente = _context.Set<Voto>()
            .FirstOrDefault(v => v.RecetaId == idReceta && v.UsuarioId == idUsuario);
        // Si ya existe un voto, lo elimina (dislike)
        if(votoExistente != null)
            _context.Set<Voto>().Remove(votoExistente);
        else // Si no existe, crea un nuevo voto (like)
        {
            
            Voto nuevoVoto = new()
            {
                RecetaId = idReceta,
                UsuarioId = idUsuario,
                FechaDeVoto = DateTime.Now
            };
            _context.Set<Voto>().Add(nuevoVoto);
        }
        await _context.SaveChangesAsync();
        return true;
    }
}
