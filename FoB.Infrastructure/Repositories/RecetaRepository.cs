using FoB.Application.Dtos;
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
            RecetaImagen = new List<RecetaImagen>(),
            IngredienteReceta = new List<IngredienteReceta>(),
            RecetaCategoria = new List<RecetaCategoria>(),
            Paso = new List<Paso>()
        };

        if (receta.Imagen != null && receta.Imagen.Length > 0)
        {
            nuevaReceta.RecetaImagen.Add(new RecetaImagen { Imagen = receta.Imagen });
        }

        if (receta.TiempoPreparacion.HasValue)
            nuevaReceta.TiempoPreparacion = TimeOnly.FromTimeSpan(TimeSpan.FromMinutes(receta.TiempoPreparacion.Value));

        // Lógica para procesar ingredientes
        if (receta.Ingredientes != null && receta.Ingredientes.Count > 0)
        {
            foreach (var item in receta.Ingredientes)
            {
                var ingrediente = await IngredienteCreateIfNotExist(item);
                IngredienteReceta ingredienteReceta = new()
                {
                    Ingrediente = ingrediente,
                    UnidadDeMedida = item.UnidadDeMedida,
                    Cantidad = item.Cantidad.GetValueOrDefault(),
                    Receta = nuevaReceta
                };
                nuevaReceta.IngredienteReceta.Add(ingredienteReceta);
            }
        }

        // Lógica para procesar categorías
        if (receta.Categorias != null && receta.Categorias.Count > 0)
        {
            foreach (var item in receta.Categorias)
            {
                var categoria = await CategoriaCreateIfNotExist(item);
                RecetaCategoria categoriaReceta = new()
                {
                    Categoria = categoria,
                    Receta = nuevaReceta
                };
                nuevaReceta.RecetaCategoria.Add(categoriaReceta);
            }
        }

        // Lógica para procesar pasos
        if (receta.Pasos != null && receta.Pasos.Count > 0)
        {
            for (int i = 0; i < receta.Pasos.Count; i++)
            {
                var pasoDto = receta.Pasos[i];
                Paso paso = new()
                {
                    Titulo = pasoDto.Titulo,
                    Descripcion = pasoDto.Descripcion,
                    Numero = i + 1,
                    Receta = nuevaReceta
                };
                nuevaReceta.Paso.Add(paso);

                // Guarda imagen del paso si existe
                if (!string.IsNullOrEmpty(pasoDto.Imagen))
                {
                    byte[] imagenPaso = Convert.FromBase64String(pasoDto.Imagen);
                    var recetaImagen = new RecetaImagen { Imagen = imagenPaso, Paso = paso };
                    nuevaReceta.RecetaImagen.Add(recetaImagen);
                    if (paso.RecetaImagen == null) paso.RecetaImagen = new List<RecetaImagen>();
                    paso.RecetaImagen.Add(recetaImagen);
                }
            }
        }

        await _context.Receta.AddAsync(nuevaReceta);
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
            .Where(x => x.Activa == true  && x.UsuarioId != _currentUser.User.Id);

        // Sort by creation date (desc) and then by average rating (desc)
        query = query.OrderByDescending(x => x.FechaCreacion)
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
            Imagen = x.RecetaImagen.FirstOrDefault(x => x.PasoId == null).Imagen,
            FechaCreacion = x.FechaCreacion,
            MeGusta = x.Voto.Any(x=>x.UsuarioId == _currentUser.User.Id && x.Tipo == InteraccionTipoEnum.Like.ToString()),
            NoMeGusta = x.Voto.Any(x => x.UsuarioId == _currentUser.User.Id && x.Tipo == InteraccionTipoEnum.Dislike.ToString()),
            EsFavorito = x.Voto.Any(x => x.UsuarioId == _currentUser.User.Id && x.Tipo == InteraccionTipoEnum.Dislike.ToString()),
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
            Categorias = x.RecetaCategoria.Select(c => c.Categoria.Nombre).ToList(),
            Pasos = x.Paso.Select(p => new PasoResponse
            {
                Numero = p.Numero,
                Titulo = p.Titulo,
                Descripcion = p.Descripcion,
                Imagen = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? Convert.ToBase64String(p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen)
                    : null
            }).ToList()
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
                             .ThenInclude(x => x.Usuario)
                        .Include(x => x.IngredienteReceta)
                             .ThenInclude(x => x.Ingrediente)
                        .Include(x => x.RecetaCategoria)
                             .ThenInclude(x => x.Categoria)
                        .Include(x => x.Paso)
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
            MeGusta = x.Voto.Any(v => v.UsuarioId == currentUserId && v.Tipo == InteraccionTipoEnum.Like.ToString()),
            NoMeGusta = x.Voto.Any(x => x.UsuarioId == _currentUser.User.Id && x.Tipo == InteraccionTipoEnum.Dislike.ToString()),
            EsFavorito = x.Voto.Any(x => x.UsuarioId == _currentUser.User.Id && x.Tipo == InteraccionTipoEnum.Favorito.ToString()),
            CantidadComentarios = x.Comentario.Count(),
            VistaPreviaComentarios = x.Comentario.OrderByDescending(c => c.Fecha).Take(3)
                                                .Select(c => new ComentarioResponse
                                                {
                                                    Id = c.Id,
                                                    Texto = c.Texto,
                                                    Fecha = c.Fecha,
                                                    Usuario = new UsuarioResponse
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
            Imagen = x.RecetaImagen.FirstOrDefault(x=>x.PasoId == null).Imagen,
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
            Categorias = x.RecetaCategoria.Select(c => c.Categoria.Nombre).ToList(),
            Pasos = x.Paso.Select(p => new PasoResponse
            {
                Numero = p.Numero,
                Titulo = p.Titulo,
                Descripcion = p.Descripcion,
                Imagen = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? Convert.ToBase64String(p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen)
                    : null
            }).ToList()
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

    public async Task<bool> Interaccion(InteraccionDto interaccion)
    {
        var idUsuario = _currentUser.User.Id;
        var votoExistente = _context.Set<Voto>()
            .FirstOrDefault(v => v.RecetaId == interaccion.IdReceta 
                            &&  v.Tipo==interaccion.Tipo.ToString() 
                            && v.UsuarioId == idUsuario);
        
        if(interaccion.Accion == InteraccionAccionEnum.Borrar)
        {
            if (votoExistente != null)
                _context.Set<Voto>().Remove(votoExistente);
        }
        else
        {
            if (votoExistente == null)
            {
                int valorTipo = interaccion.Tipo == InteraccionTipoEnum.Like ? 1 :
                                                (interaccion.Tipo == InteraccionTipoEnum.Dislike ? -1 :
                                                (interaccion.Tipo == InteraccionTipoEnum.Favorito ? 5 : 0));

                Voto nuevoVoto = new()
                {
                    RecetaId = interaccion.IdReceta,
                    Tipo = interaccion.Tipo.ToString(),
                    Valor = valorTipo,
                    UsuarioId = idUsuario,
                    FechaDeVoto = DateTime.Now
                };
                _context.Set<Voto>().Add(nuevoVoto);
            }
        }
        
        await _context.SaveChangesAsync();
        return true;
    }

    // método para eliminar una receta
    public async Task<bool> DeleteAsync(int recetaId)
    {
        var currentUserId = _currentUser.User.Id;

        var recetaToDelete = await _context.Receta
                                            .FirstOrDefaultAsync(r => r.Id == recetaId && r.UsuarioId == currentUserId);

        if (recetaToDelete == null)
        {
            // La receta no existe o el usuario actual no es el autor
            return false;
        }

        _context.Receta.Remove(recetaToDelete);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<RecetaResponse> GetById(int idReceta)
    {
        // Obtiene el ID del usuario actual para saber si le gusta la receta
        var userId = _currentUser.User?.Id;

        var receta = await _context.Receta
            .Include(r => r.Usuario)
                .ThenInclude(u => u.UsuarioImagen)
            .Include(r => r.RecetaImagen)
            .Include(r => r.IngredienteReceta).ThenInclude(ir => ir.Ingrediente)
            .Include(r => r.Paso)
            .Include(r => r.RecetaCategoria).ThenInclude(rc => rc.Categoria)
            .Include(r => r.Voto)
            .Include(r => r.Comentario).ThenInclude(c => c.Usuario)
            .FirstOrDefaultAsync(r => r.Id == idReceta);

        if (receta == null)
        {
            return null;
        }

        var recetaResponse = new RecetaResponse
        {
            Id = receta.Id,
            Titulo = receta.Titulo,
            Descripcion = receta.Descripcion,
            Dificultad = receta.Dificultad,
            TiempoPreparacion = receta.TiempoPreparacion != null
                ? new TimeSpan(receta.TiempoPreparacion.Value.Hour, receta.TiempoPreparacion.Value.Minute, receta.TiempoPreparacion.Value.Second)
                : (TimeSpan?)null,
            FechaCreacion = receta.FechaCreacion,
            Imagen = receta.RecetaImagen.FirstOrDefault()?.Imagen,
            Autor = receta.Usuario != null ? new UsuarioResponse
            {
                Id = receta.Usuario.Id,
                Nombre = receta.Usuario.Nombre,
                NombreUsuario = receta.Usuario.NombreUsuario,
                Apellido = receta.Usuario.Apellido,
                Imagen = receta.Usuario.UsuarioImagen.FirstOrDefault()?.Imagen
            } : null,
            Ingredientes = receta.IngredienteReceta?.Select(ir => new IngredienteResponse
            {
                Id = ir.Ingrediente.Id,
                Nombre = ir.Ingrediente.Nombre,
                Cantidad = ir.Cantidad,
                UnidadDeMedida = ir.UnidadDeMedida
            }).ToList() ?? new List<IngredienteResponse>(),
            Pasos = receta.Paso?.Select(p => new PasoResponse
            {
                Numero = p.Numero,
                Titulo = p.Titulo,
                Descripcion = p.Descripcion,
                Imagen = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? Convert.ToBase64String(p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen)
                    : null
            }).ToList() ?? new List<PasoResponse>(),
            Categorias = receta.RecetaCategoria?.Select(rc => rc.Categoria.Nombre).ToList() ?? new List<string>(),
            CantidadVotos = receta.Voto.Count,
            // Utiliza el ID del usuario para verificar si le gusta la receta
            MeGusta = userId.HasValue && receta.Voto.Any(v => v.UsuarioId == userId.Value),
            CantidadComentarios = receta.Comentario.Count,
            VistaPreviaComentarios = receta.Comentario?.Where(c => c.Usuario != null)
                .OrderByDescending(c => c.Fecha)
                .Take(3)
                .Select(c => new ComentarioResponse
                {
                    Id = c.Id,
                    Texto = c.Texto,
                    Usuario = new UsuarioResponse { NombreUsuario = c.Usuario.NombreUsuario },
                    Fecha = c.Fecha
                }).ToList() ?? new List<ComentarioResponse>()
        };
        return recetaResponse;
    }
}
