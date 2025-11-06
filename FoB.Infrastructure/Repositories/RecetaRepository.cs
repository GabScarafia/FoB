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
            RecetaEtiquetas = new List<RecetaEtiquetas>(),
            Paso = new List<Paso>()
        };

        if (receta.Imagen != null && receta.Imagen.Length > 0)
        {
            nuevaReceta.RecetaImagen.Add(new RecetaImagen { Imagen = receta.Imagen, ContentType = receta.ContentType });
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
                    UnidadId = item.UnidadId,
                    Cantidad = item.Cantidad.GetValueOrDefault(),
                    Receta = nuevaReceta
                };
                nuevaReceta.IngredienteReceta.Add(ingredienteReceta);
            }
        }

        // Lógica para procesar categorías
        if (receta.Etiquetas != null && receta.Etiquetas.Count > 0)
        {
            foreach (var item in receta.Etiquetas)
            {
                var Etiquetas = await EtiquetasCreateIfNotExist(item);
                RecetaEtiquetas EtiquetasReceta = new()
                {
                    Etiquetas = Etiquetas,
                    Receta = nuevaReceta
                };
                nuevaReceta.RecetaEtiquetas.Add(EtiquetasReceta);
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
                    var recetaImagen = new RecetaImagen { Imagen = imagenPaso, Paso = paso, ContentType = pasoDto.ContentType };
                    nuevaReceta.RecetaImagen.Add(recetaImagen);
                    if (paso.RecetaImagen == null) paso.RecetaImagen = new List<RecetaImagen>();
                    paso.RecetaImagen.Add(recetaImagen);
                }
            }
        }

        await _context.Receta.AddAsync(nuevaReceta);
        await _context.SaveChangesAsync();

        // Creo registro de participación si viene un desafío asociado
        if (receta.DesafioId.HasValue)
        {
            ParticipacionDesafio participacion = new()
            {
                FechaParticipacion = DateTime.Now,
                DesafioId = receta.DesafioId.Value,
                UsuarioId = _currentUser.User.Id,
                RecetaId = nuevaReceta.Id,
                Puntos = 50 // Puntos fijos por participar
            };

            await _context.ParticipacionDesafio.AddAsync(participacion);
            await _context.SaveChangesAsync();
        }

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
    private async Task<Etiquetas> EtiquetasCreateIfNotExist(EtiquetaRequest EtiquetasRequest)
    {
        var Etiquetas = await _context.Set<Etiquetas>().FirstOrDefaultAsync(x => x.Id == EtiquetasRequest.Id || x.Nombre == EtiquetasRequest.Nombre);
        if (Etiquetas != null)
            return Etiquetas;
        else
        {
            Etiquetas = new Etiquetas() { Nombre = EtiquetasRequest.Nombre, Descripcion = EtiquetasRequest.Descripcion };
            await _context.Set<Etiquetas>().AddAsync(Etiquetas);
            await _context.SaveChangesAsync();
            return Etiquetas;
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
            .Include(r => r.IngredienteReceta)
                .ThenInclude(ir => ir.Unidad)
            .Include(x => x.RecetaEtiquetas)
                .ThenInclude(x => x.Etiquetas)
            .AsSplitQuery()
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
            ContentType = x.RecetaImagen.FirstOrDefault(x => x.PasoId == null).ContentType,
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
                UnidadDeMedida = i.Unidad.Nombre
            }).ToList(),
            Etiquetas = x.RecetaEtiquetas.Select(c => c.Etiquetas.Nombre).ToList(),
            Pasos = x.Paso.Select(p => new PasoResponse
            {
                Numero = p.Numero,
                Titulo = p.Titulo,
                Descripcion = p.Descripcion,
                Imagen = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? Convert.ToBase64String(p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen)
                    : null,
                ContentType = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().ContentType
                    : null,
            }).ToList()
    })
        .ToListAsync();

        list.ForEach(
            x =>
            {
                var seguido = _context.Set<SeguimientoUsuario>()
                                .Any(s => s.SeguidorId == _currentUser.User.Id && s.SeguidoId == x.Autor.Id);
                x.Seguido = seguido;
            });

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
                        .Include(r => r.IngredienteReceta)
                            .ThenInclude(ir => ir.Unidad)
                        .Include(x => x.RecetaEtiquetas)
                             .ThenInclude(x => x.Etiquetas)
                        .Include(x => x.Paso)
                        .AsSplitQuery()
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
            ContentType = x.RecetaImagen.FirstOrDefault(x => x.PasoId == null).ContentType,
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
                UnidadDeMedida = i.Unidad.Nombre
            }).ToList(),
            Etiquetas = x.RecetaEtiquetas.Select(c => c.Etiquetas.Nombre).ToList(),
            Pasos = x.Paso.Select(p => new PasoResponse
            {
                Numero = p.Numero,
                Titulo = p.Titulo,
                Descripcion = p.Descripcion,
                Imagen = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? Convert.ToBase64String(p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen)
                    : null,
                ContentType = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().ContentType
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
        try
        {
            // Obtiene el ID del usuario actual para saber si le gusta la receta
            var userId = _currentUser.User?.Id;

            var receta = await _context.Receta
                .Include(r => r.Usuario)
                    .ThenInclude(u => u.UsuarioImagen)
                .Include(r => r.RecetaImagen)
                .Include(r => r.IngredienteReceta).ThenInclude(ir => ir.Ingrediente)
                .Include(r => r.IngredienteReceta).ThenInclude(ir => ir.Unidad)
                .Include(r => r.Paso)
                .Include(r => r.RecetaEtiquetas).ThenInclude(rc => rc.Etiquetas)
                .Include(r => r.Voto)
                .Include(r => r.Comentario).ThenInclude(c => c.Usuario)
                .AsSplitQuery()
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
                ContentType = receta.RecetaImagen.FirstOrDefault()?.ContentType,
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
                    UnidadDeMedida = ir.Unidad.Nombre
                }).ToList() ?? new List<IngredienteResponse>(),
                Pasos = receta.Paso?.Select(p => new PasoResponse
                {
                    Numero = p.Numero,
                    Titulo = p.Titulo,
                    Descripcion = p.Descripcion,
                    Imagen = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                        ? Convert.ToBase64String(p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen)
                        : null,
                    ContentType = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                            ? p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().ContentType
                            : null
                }).ToList() ?? new List<PasoResponse>(),
                Etiquetas = receta.RecetaEtiquetas?.Select(rc => rc.Etiquetas.Nombre).ToList() ?? new List<string>(),
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
        catch (Exception ex)
        {
            throw ex;
        }
        
    }

    /// <summary>
    /// Obtiene las estadísticas de interacciones asociadas a una receta hasta una fecha de corte especificada.
    /// Calcula los Likes históricamente utilizando 'fecha_de_voto'. Favorites y Visits se mantienen en 0.
    /// </summary>
    /// <param name="recetaId">El ID de la receta.</param>
    /// <param name="asOfDate">La fecha máxima para incluir Votos/Likes (la fecha de fin del desafío).</param>
    public async Task<RecetaStatsDto> GetRecetaStatsAsync(int recetaId, DateTime asOfDate)
    {
        // 1. Obtener la información básica de la receta y el Usuario
        var recetaBase = await _context.Receta
            .Where(r => r.Id == recetaId)
            .Select(r => new
            {
                r.Id,
                NombreUsuario = r.Usuario.NombreUsuario
            })
            .FirstOrDefaultAsync();

        if (recetaBase == null)
        {
            return new RecetaStatsDto { NombreUsuario = "N/A", Likes = 0, Favorites = 0, Visits = 0 };
        }

        var fechaCorteUtc = DateTime.SpecifyKind(asOfDate, DateTimeKind.Utc);

        // 2. Contar Likes/Votos HASTA la fecha de corte (asOfDate)
        var likesHistoricos = await _context.Voto
            // Usamos la variable con el Kind especificado
            .CountAsync(v => v.RecetaId == recetaId && v.FechaDeVoto <= fechaCorteUtc);

        // 3. Devolver el DTO con los datos calculados
        return new RecetaStatsDto
        {
            NombreUsuario = recetaBase.NombreUsuario,
            Likes = likesHistoricos,

            Favorites = 0,
            Visits = 0
        };
    }



}
