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
            nuevaReceta.TiempoPreparacion = TimeOnly.FromTimeSpan(receta.TiempoPreparacion.Value);

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
        query = query.OrderByDescending(x => x.FechaCreacion.Value.Date)
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
            FechaCreacion = x.FechaCreacion,
            MeGusta = x.Voto.Any(x=>x.UsuarioId == _currentUser.User.Id),
            FechaModificacion = x.FechaModificacion,
            PuntuacionPromedio = x.PuntuacionPromedio,
            TiempoPreparacion = x.TiempoPreparacion.HasValue ? x.TiempoPreparacion.Value.ToTimeSpan() : null,
            Autor = new UsuarioResponse
            {
                Id = x.Usuario.Id,
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

        // First, get the IDs of all users the current user is following.
        List<int> idsSeguidos = await _context.Set<Usuario>()
            .Where(x => x.SeguimientoUsuarioSeguido.Any(s => s.SeguidorId == _currentUser.User.Id))
            .Select(x => x.Id)
            .ToListAsync();

        IQueryable<Receta> query = _context.Set<Receta>()
            .Include(x => x.Usuario)
                .ThenInclude(x=>x.UsuarioImagen)
            .Include(x => x.RecetaImagen)
            .Include(x => x.Voto)
            .Include(x => x.Comentario)
            .Include(x => x.IngredienteReceta)
                .ThenInclude(x => x.Ingrediente)
            .Include(x => x.RecetaCategoria)
                .ThenInclude(x => x.Categoria)
            .Where(x => x.Activa == true && idsSeguidos.Contains(x.UsuarioId));

        // Sort by creation date (desc)
        query = query.OrderByDescending(x => x.FechaCreacion);

        // Pagination
        query = query.Skip((pageNumber - 1) * pageSize).Take(pageSize);

        var list = await query.Select(x => new RecetaResponse
        {
            Id = x.Id,
            Titulo = x.Titulo,
            Descripcion = x.Descripcion,
            Dificultad = x.Dificultad,
            CantidadVotos = x.Voto.Count(),
            MeGusta = x.Voto.Any(x => x.UsuarioId == _currentUser.User.Id),
            CantidadComentarios = x.Comentario.Count(),
            VistaPreviaComentarios = x.Comentario.OrderByDescending(c => c.Fecha)
                                        .Take(3)
                                        .Select(c => new ComentarioResponse
                                        {
                                            Id = c.Id,
                                            Texto = c.Texto,
                                            Autor = new UsuarioResponse
                                            {
                                                Id = c.Usuario.Id,
                                                NombreUsuario = c.Usuario.NombreUsuario,
                                                Nombre = c.Usuario.Nombre,
                                                Apellido = c.Usuario.Apellido,
                                                //VER: Foto = c.Usuario.Foto
                                            }
                                        }).ToList(),
            Estado = x.Estado,
            FechaCreacion = x.FechaCreacion,
            FechaModificacion = x.FechaModificacion,
            PuntuacionPromedio = x.PuntuacionPromedio,
            TiempoPreparacion = x.TiempoPreparacion.HasValue ? x.TiempoPreparacion.Value.ToTimeSpan() : null,
            Autor = new UsuarioResponse
            {
                Id = x.Usuario.Id,
                NombreUsuario = x.Usuario.NombreUsuario,
                Nombre = x.Usuario.Nombre,
                Apellido = x.Usuario.Apellido,
                //VER: Foto = x.Usuario.Foto
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
}
