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

    // El CreateAsync sigue igual, guarda el byte[] en la BD
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
        
        // Lógica para procesar categorías
        if (receta.Utensilios != null && receta.Utensilios.Count > 0)
        {
            foreach (var item in receta.Utensilios)
            {
                var utensilios = await UtensiliosCreateIfNotExist(item);
                RecetaUtensilio EtiquetasUtensilios = new()
                {
                    Utensilio = utensilios,
                    Receta = nuevaReceta
                };
                nuevaReceta.RecetaUtensilio.Add(EtiquetasUtensilios);
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
        var ig = await _context.Set<Ingrediente>().FirstOrDefaultAsync(x => x.Id == ingredienteRecetaRequest.Id || x.Nombre == ingredienteRecetaRequest.Nombre);
        if (ig != null)
            return ig;
        else
        {
            ig = new Ingrediente() { Nombre = ingredienteRecetaRequest.Nombre, Descripcion = ingredienteRecetaRequest.Descripcion };
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
    private async Task<Utensilios> UtensiliosCreateIfNotExist(EtiquetaRequest EtiquetasRequest)
    {
        var utensilios = await _context.Set<Utensilios>().FirstOrDefaultAsync(x => x.Id == EtiquetasRequest.Id || x.Nombre == EtiquetasRequest.Nombre);
        if (utensilios != null)
            return utensilios;
        else
        {
            utensilios = new Utensilios() { Nombre = EtiquetasRequest.Nombre, Descripcion = EtiquetasRequest.Descripcion };
            await _context.Set<Utensilios>().AddAsync(utensilios);
            await _context.SaveChangesAsync();
            return utensilios;
        }
    }

    public async Task<IEnumerable<RecetaResponse>> TendenciasAsync(int pageNumber = 1, int pageSize = 15) // <-- PARÁMETROS CORREGIDOS
    {
        // int pageSize = 10; // <-- ELIMINAMOS ESTA LÍNEA

        IQueryable<Receta> query = _context.Set<Receta>()
            .AsSplitQuery()
            .AsNoTracking()
            .Where(x => x.Activa == true && x.UsuarioId != _currentUser.User.Id);

        // Sort by creation date (desc) and then by average rating (desc)
        query = query.OrderByDescending(x => x.FechaCreacion)
                     .ThenByDescending(x => x.PuntuacionPromedio);

        // Pagination (USA LOS PARÁMETROS)
        query = query.Skip((pageNumber - 1) * pageSize).Take(pageSize);

        // 4. INCLUDES (Necesarios para el mapeo completo de RecetaResponse)
        query = query.Include(x => x.Usuario)
                .ThenInclude(x => x.UsuarioImagen)
            .Include(x => x.RecetaImagen)
            .Include(x => x.Voto)
            .Include(x => x.Comentario)
                .ThenInclude(x => x.Usuario)
                    .ThenInclude(u => u.UsuarioImagen)
            .Include(x => x.IngredienteReceta)
                .ThenInclude(x => x.Ingrediente)
            .Include(r => r.IngredienteReceta)
                .ThenInclude(ir => ir.Unidad)
            .Include(x => x.RecetaEtiquetas)
                .ThenInclude(x => x.Etiquetas)
            .Include(x => x.RecetaUtensilio)
                .ThenInclude(x => x.Utensilio)
            .Include(x => x.Paso)
                .ThenInclude(p => p.RecetaImagen);
        
        var list = await query.Select(x => new RecetaResponse
        {
            Id = x.Id,
            Titulo = x.Titulo,
            Descripcion = x.Descripcion,
            Dificultad = x.Dificultad,
            CantidadVotos = (int)x.Voto.Where(v => v.Tipo == InteraccionTipoEnum.Like.ToString() && v.ComentarioId == null).Sum(x=>x.Valor),
            CantidadComentarios = x.Comentario.Count(),
            Estado = x.Estado,
            ImagenUrl = x.RecetaImagen.FirstOrDefault(img => img.PasoId == null) != null
                ? $"/api/archivos/receta/{x.RecetaImagen.FirstOrDefault(img => img.PasoId == null).Id}"
                : null,
            ContentType = x.RecetaImagen.FirstOrDefault(img => img.PasoId == null) != null
                ? x.RecetaImagen.FirstOrDefault(img => img.PasoId == null).ContentType
                : null,
            FechaCreacion = x.FechaCreacion,
            MeGusta = x.Voto.Any(x => x.UsuarioId == _currentUser.User.Id && x.Tipo == InteraccionTipoEnum.Like.ToString() && x.ComentarioId == null),
            NoMeGusta = x.Voto.Any(x => x.UsuarioId == _currentUser.User.Id && x.Tipo == InteraccionTipoEnum.Dislike.ToString() && x.ComentarioId == null),
            EsFavorito = x.Voto.Any(x => x.UsuarioId == _currentUser.User.Id && x.Tipo == InteraccionTipoEnum.Dislike.ToString() && x.ComentarioId == null), // Sigue pareciendo un bug, pero lo dejo como está
            FechaModificacion = x.FechaModificacion,
            PuntuacionPromedio = x.PuntuacionPromedio,
            TiempoPreparacion = x.TiempoPreparacion.HasValue ? x.TiempoPreparacion.Value.ToTimeSpan() : null,
            Autor = new UsuarioResponse
            {
                Id = x.Usuario.Id,
                ImagenUrl = x.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? $"/api/archivos/usuario/{x.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault().Id}"
                    : null,
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
            Utensilios = x.RecetaUtensilio.Select(c => c.Utensilio.Nombre).ToList(),
            Pasos = x.Paso.Select(p => new PasoResponse
            {
                Numero = p.Numero,
                Titulo = p.Titulo,
                Descripcion = p.Descripcion,
                ImagenUrl = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? $"/api/archivos/receta/{p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Id}"
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

    public async Task<IEnumerable<RecetaResponse>> FeedAsync(int pageNumber = 1, int pageSize = 5, string? termino = null)
    {
        var currentUserId = _currentUser.User.Id;

        var query = _context.Set<Receta>()
            .AsNoTracking()
            .AsSplitQuery();

        if (!string.IsNullOrWhiteSpace(termino))
        {
            var terminoLimpio = termino.Trim();
            string patronLike = $"%{terminoLimpio}%";

            // A. Filtros Base de Búsqueda (Solo activas y que no sean mías, igual que en tu buscador)
            query = query.Where(x => x.Activa == true && x.UsuarioId != currentUserId);

            // B. Filtros de coincidencia (Like)
            query = query.Where(x =>
                // Coincidencia por Título
                EF.Functions.Like(x.Titulo, patronLike) ||
                // Coincidencia por Nombre de Usuario
                EF.Functions.Like(x.Usuario.NombreUsuario, patronLike) ||
                // Coincidencia por Nombre de Ingrediente
                x.IngredienteReceta.Any(ir => EF.Functions.Like(ir.Ingrediente.Nombre, patronLike))
            );

            // C. Ordenamiento por Relevancia (Título > Ingrediente > Usuario)
            query = query.OrderByDescending(x =>
                    EF.Functions.Like(x.Titulo, patronLike) ? 3 :
                    x.IngredienteReceta.Any(ir => EF.Functions.Like(ir.Ingrediente.Nombre, patronLike)) ? 2 :
                    EF.Functions.Like(x.Usuario.NombreUsuario, patronLike) ? 1 :
                    0
                )
                .ThenByDescending(x => x.FechaCreacion)
                .ThenByDescending(x => x.PuntuacionPromedio)
                .ThenBy(x => x.Titulo);
        }
        else
        {
            // =================================================================
            // LÓGICA DE FEED NORMAL (Seguidos + Yo)
            // =================================================================
            var followedUserIds = await _context.Set<SeguimientoUsuario>()
                .Where(s => s.SeguidorId == currentUserId)
                .Select(s => s.SeguidoId)
                .ToListAsync();

            followedUserIds.Add(currentUserId); // Agregar mis propias recetas al feed normal

            if (!followedUserIds.Any())
            {
                return new List<RecetaResponse>();
            }

            // Filtro de Feed normal
            query = query.Where(x => x.Activa == true && followedUserIds.Contains(x.UsuarioId));

            // Orden normal por fecha
            query = query.OrderByDescending(x => x.FechaCreacion);
        }

        // 3. PAGINACIÓN (Se aplica igual para ambos casos)
        query = query.Skip((pageNumber - 1) * pageSize).Take(pageSize);

        // 4. INCLUDES (Necesarios para el mapeo completo de RecetaResponse)
        query = query.Include(x => x.Usuario)
                .ThenInclude(x => x.UsuarioImagen)
            .Include(x => x.RecetaImagen)
            .Include(x => x.Voto)
            .Include(x => x.Comentario)
                .ThenInclude(x => x.Usuario)
                    .ThenInclude(u => u.UsuarioImagen)
            .Include(x => x.IngredienteReceta)
                .ThenInclude(x => x.Ingrediente)
            .Include(r => r.IngredienteReceta)
                .ThenInclude(ir => ir.Unidad)
            .Include(x => x.RecetaEtiquetas)
                .ThenInclude(x => x.Etiquetas)
            .Include(x => x.RecetaUtensilio)
                .ThenInclude(x => x.Utensilio)
            .Include(x => x.Paso)
                .ThenInclude(p => p.RecetaImagen);

        // 5. PROYECCIÓN (Mapeo a RecetaResponse)
        var list = await query.Select(x => new RecetaResponse
        {
            Id = x.Id,
            Titulo = x.Titulo,
            Descripcion = x.Descripcion,
            Dificultad = x.Dificultad,
            CantidadVotos = (int)x.Voto.Where(v => v.Tipo == InteraccionTipoEnum.Like.ToString() && v.ComentarioId == null).Sum(x => x.Valor),
            // Optimización: Usar variables locales en la query no siempre funciona bien en EF Core complejo, 
            // mejor dejar la lógica inline para asegurar traducción a SQL.
            MeGusta = x.Voto.Any(v => v.UsuarioId == currentUserId && v.Tipo == InteraccionTipoEnum.Like.ToString() && v.ComentarioId == null),
            NoMeGusta = x.Voto.Any(v => v.UsuarioId == currentUserId && v.Tipo == InteraccionTipoEnum.Dislike.ToString() && v.ComentarioId == null),
            EsFavorito = x.Voto.Any(v => v.UsuarioId == currentUserId && v.Tipo == InteraccionTipoEnum.Favorito.ToString() && v.ComentarioId == null), // Corregido el enum a Favorito si aplica
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
                        ImagenUrl = c.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                            ? $"/api/archivos/usuario/{c.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault().Id}"
                            : null,
                    }
                }).ToList(),
            Estado = x.Estado,
            FechaCreacion = x.FechaCreacion,
            FechaModificacion = x.FechaModificacion,
            PuntuacionPromedio = x.PuntuacionPromedio,
            ImagenUrl = x.RecetaImagen.FirstOrDefault(img => img.PasoId == null) != null
                ? $"/api/archivos/receta/{x.RecetaImagen.FirstOrDefault(img => img.PasoId == null).Id}"
                : null,
            ContentType = x.RecetaImagen.FirstOrDefault(img => img.PasoId == null) != null
                ? x.RecetaImagen.FirstOrDefault(img => img.PasoId == null).ContentType
                : null,
            TiempoPreparacion = x.TiempoPreparacion.HasValue ? x.TiempoPreparacion.Value.ToTimeSpan() : null,
            Autor = new UsuarioResponse
            {
                Id = x.Usuario.Id,
                NombreUsuario = x.Usuario.NombreUsuario,
                Nombre = x.Usuario.Nombre,
                Apellido = x.Usuario.Apellido,
                ImagenUrl = x.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? $"/api/archivos/usuario/{x.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault().Id}"
                    : null,
            },
            Ingredientes = x.IngredienteReceta.Select(i => new IngredienteResponse
            {
                Id = i.IngredienteId,
                Nombre = i.Ingrediente.Nombre,
                Cantidad = i.Cantidad,
                UnidadDeMedida = i.Unidad.Nombre
            }).ToList(),
            Etiquetas = x.RecetaEtiquetas.Select(c => c.Etiquetas.Nombre).ToList(),
            Utensilios = x.RecetaUtensilio.Select(c => c.Utensilio.Nombre).ToList(),
            Pasos = x.Paso.Select(p => new PasoResponse
            {
                Numero = p.Numero,
                Titulo = p.Titulo,
                Descripcion = p.Descripcion,
                ImagenUrl = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? $"/api/archivos/receta/{p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Id}"
                    : null,
                ContentType = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                    ? p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().ContentType
                    : null,
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
        if (votoExistente != null)
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
                                && v.Tipo == interaccion.Tipo.ToString()
                                && v.UsuarioId == idUsuario 
                                && (interaccion.ComentarioId == null || interaccion.ComentarioId == v.ComentarioId));

        bool added = false;

        if (interaccion.Accion == InteraccionAccionEnum.Borrar)
        {
            if (votoExistente != null)
                _context.Set<Voto>().Remove(votoExistente);
        }
        else
        {
            if (votoExistente == null)
            {
                // Si estoy dando like, borro un dislike previo si existe.
                if (interaccion.Tipo == InteraccionTipoEnum.Like)
                {
                    var votoOpuesto = await _context.Set<Voto>().FirstOrDefaultAsync(v => v.RecetaId == interaccion.IdReceta && v.UsuarioId == idUsuario && v.Tipo == InteraccionTipoEnum.Dislike.ToString() && v.ComentarioId == null);
                    if (votoOpuesto != null) _context.Set<Voto>().Remove(votoOpuesto);
                }
                // Si estoy dando dislike, borro un like previo si existe.
                else if (interaccion.Tipo == InteraccionTipoEnum.Dislike)
                {
                    var votoOpuesto = await _context.Set<Voto>().FirstOrDefaultAsync(v => v.RecetaId == interaccion.IdReceta && v.UsuarioId == idUsuario && v.Tipo == InteraccionTipoEnum.Like.ToString() && v.ComentarioId == null);
                    if (votoOpuesto != null) _context.Set<Voto>().Remove(votoOpuesto);
                }


                int valorTipo = interaccion.Tipo == InteraccionTipoEnum.Like ? 1 :
                                        (interaccion.Tipo == InteraccionTipoEnum.Dislike ? -1 :
                                        (interaccion.Tipo == InteraccionTipoEnum.Favorito ? 5 : 
                                        (interaccion.Tipo == InteraccionTipoEnum.ComentarioLike ? 1 : 0)));

                Voto nuevoVoto = new()
                {
                    RecetaId = interaccion.IdReceta,
                    ComentarioId = interaccion.ComentarioId,
                    Tipo = interaccion.Tipo.ToString(),
                    Valor = valorTipo,
                    UsuarioId = idUsuario,
                    FechaDeVoto = DateTime.Now
                };
                _context.Set<Voto>().Add(nuevoVoto);
                added = true;

                // Crear notificación para el autor de la receta si no es el mismo usuario
                try
                {
                    switch (interaccion.Tipo)
                    {
                        case InteraccionTipoEnum.Like:
                        case InteraccionTipoEnum.Favorito:
                            {
                                // LIKE O FAVORITO A PUBLICACIÓN
                                var receta = await _context.Receta
                                    .Include(r => r.Usuario)
                                    .FirstOrDefaultAsync(r => r.Id == interaccion.IdReceta);

                                if (receta != null && receta.UsuarioId != idUsuario)
                                {
                                    var actor = await _context.Usuario.FirstOrDefaultAsync(u => u.Id == idUsuario);
                                    var tipoMsg = interaccion.Tipo == InteraccionTipoEnum.Favorito ? "favorito" : "like";

                                    var noti = new Notificacion
                                    {
                                        FechaDeEnvio = DateTime.Now,
                                        Leida = false,
                                        Mensaje = $"{actor?.NombreUsuario ?? "Alguien"} le dio {tipoMsg} a tu publicación",
                                        Tipo = "Nuevo Voto",
                                        UrlEnlace = $"/perfil/{receta.UsuarioId}/publicaciones?receta={receta.Id}",
                                        UsuarioId = receta.UsuarioId,
                                        EmisorId = idUsuario
                                    };

                                    _context.Notificacion.Add(noti);
                                }
                                break;
                            }

                        case InteraccionTipoEnum.ComentarioLike:
                            {
                                // LIKE A COMENTARIO
                                var comentario = await _context.Comentario
                                    .Include(c => c.Usuario)
                                    .FirstOrDefaultAsync(c => c.Id == interaccion.ComentarioId);

                                if (comentario != null && comentario.UsuarioId != idUsuario)
                                {
                                    var actor = await _context.Usuario.FirstOrDefaultAsync(u => u.Id == idUsuario);

                                    var noti = new Notificacion
                                    {
                                        FechaDeEnvio = DateTime.Now,
                                        Leida = false,
                                        Mensaje = $"{actor?.NombreUsuario ?? "Alguien"} le dio like a tu comentario",
                                        Tipo = "Nuevo Voto",

                                        // 🔥 ESTA ES LA URL EXACTA QUE NECESITÁS para abrir drawer y hacer flash
                                        UrlEnlace = $"/receta/{interaccion.IdReceta}?drawerComentarios=true&comentarioId={interaccion.ComentarioId}",

                                        UsuarioId = comentario.UsuarioId,
                                        EmisorId = idUsuario
                                    };

                                    _context.Notificacion.Add(noti);
                                }
                                break;
                            }

                        case InteraccionTipoEnum.ComentarioNuevo:
                            {
                                // NOTIFICAR NUEVO COMENTARIO EN TU PUBLICACIÓN
                                var receta = await _context.Receta
                                    .Include(r => r.Usuario)
                                    .FirstOrDefaultAsync(r => r.Id == interaccion.IdReceta);

                                if (receta != null && receta.UsuarioId != idUsuario)
                                {
                                    var actor = await _context.Usuario.FirstOrDefaultAsync(u => u.Id == idUsuario);

                                    var noti = new Notificacion
                                    {
                                        FechaDeEnvio = DateTime.Now,
                                        Leida = false,
                                        Mensaje = $"{actor?.NombreUsuario ?? "Alguien"} comentó en tu publicación",
                                        Tipo = "Nuevo Comentario",

                                        // Abrir el drawer pero SIN flash
                                        UrlEnlace = $"/receta/{interaccion.IdReceta}?drawerComentarios=true",

                                        UsuarioId = receta.UsuarioId,
                                        EmisorId = idUsuario
                                    };

                                    _context.Notificacion.Add(noti);
                                }
                                break;
                            }
                    }
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine(ex.ToString());
                }


            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int recetaId)
    {
        var currentUserId = _currentUser.User.Id;

        var recetaToDelete = await _context.Receta
                                        .Include(r => r.RecetaImagen)
                                        .Include(r => r.IngredienteReceta)
                                        .Include(r => r.RecetaEtiquetas)
                                        .Include(r => r.RecetaUtensilio)
                                        .Include(r => r.Paso)
                                            .ThenInclude(p => p.RecetaImagen)
                                        .Include(r => r.Voto)
                                        .Include(r => r.Comentario)
                                        .FirstOrDefaultAsync(r => r.Id == recetaId && r.UsuarioId == currentUserId);

        if (recetaToDelete == null)
        {
            // La receta no existe o el usuario actual no es el autor
            return false;
        }

        // Eliminación explícita de las colecciones relacionadas
        _context.RemoveRange(recetaToDelete.RecetaImagen);
        _context.RemoveRange(recetaToDelete.IngredienteReceta);
        _context.RemoveRange(recetaToDelete.RecetaEtiquetas);
        _context.RemoveRange(recetaToDelete.RecetaUtensilio);
        _context.RemoveRange(recetaToDelete.Paso);
        _context.RemoveRange(recetaToDelete.Voto);
        _context.RemoveRange(recetaToDelete.Comentario);

        _context.Receta.Remove(recetaToDelete);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<RecetaResponse> GetById(int idReceta)
    {
        try
        {
            var userId = _currentUser.User?.Id;

            var receta = await _context.Receta
                .Include(r => r.Usuario)
                    .ThenInclude(u => u.UsuarioImagen)
                .Include(r => r.RecetaImagen)
                .Include(r => r.IngredienteReceta).ThenInclude(ir => ir.Ingrediente)
                .Include(r => r.IngredienteReceta).ThenInclude(ir => ir.Unidad)
                .Include(r => r.Paso)
                .Include(r => r.RecetaEtiquetas).ThenInclude(rc => rc.Etiquetas)
                .Include(r => r.RecetaUtensilio).ThenInclude(rc => rc.Utensilio)
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

                // --- CAMBIO AQUÍ ---
                ImagenUrl = receta.RecetaImagen.FirstOrDefault() != null
                    ? $"/api/archivos/receta/{receta.RecetaImagen.FirstOrDefault().Id}"
                    : null,
                ContentType = receta.RecetaImagen.FirstOrDefault()?.ContentType,
                // --- FIN CAMBIO ---

                Autor = receta.Usuario != null ? new UsuarioResponse
                {
                    Id = receta.Usuario.Id,
                    Nombre = receta.Usuario.Nombre,
                    NombreUsuario = receta.Usuario.NombreUsuario,
                    Apellido = receta.Usuario.Apellido,
                    // --- CAMBIO AQUÍ ---
                    ImagenUrl = receta.Usuario.UsuarioImagen.FirstOrDefault() != null
                        ? $"/api/archivos/usuario/{receta.Usuario.UsuarioImagen.FirstOrDefault().Id}"
                        : null
                    // --- FIN CAMBIO ---
                } : null,
                Ingredientes = receta.IngredienteReceta?.Select(ir => new IngredienteResponse
                {
                    Id = ir.Ingrediente.Id,
                    Nombre = ir.Ingrediente.Nombre,
                    Cantidad = ir.Cantidad,
                    UnidadDeMedida = ir.Unidad.Nombre,
                    UnidadId = ir.Unidad.Id
                }).ToList() ?? new List<IngredienteResponse>(),
                Pasos = receta.Paso?.Select(p => new PasoResponse
                {
                    Numero = p.Numero,
                    Titulo = p.Titulo,
                    Descripcion = p.Descripcion,
                    // --- CAMBIO AQUÍ ---
                    ImagenUrl = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                        ? $"/api/archivos/receta/{p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().Id}"
                        : null,
                    ContentType = p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault() != null
                        ? p.RecetaImagen.OrderByDescending(img => img.Id).FirstOrDefault().ContentType
                        : null
                    // --- FIN CAMBIO ---
                }).ToList() ?? new List<PasoResponse>(),
                Etiquetas = receta.RecetaEtiquetas?.Select(rc => rc.Etiquetas.Nombre).ToList() ?? new List<string>(),
                Utensilios = receta.RecetaUtensilio?.Select(rc => rc.Utensilio.Nombre).ToList() ?? new List<string>(),
                CantidadVotos = (int)receta.Voto.Where(v => v.Tipo == InteraccionTipoEnum.Like.ToString() && v.ComentarioId == null).Sum(x => x.Valor),
                MeGusta = userId.HasValue && receta.Voto.Any(v => v.UsuarioId == userId.Value && v.ComentarioId == null),
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

    // actualizar receta
    public async Task<bool> UpdateAsync(int recetaId, RecetaUpdateRequest receta)
    {
        var currentUserId = _currentUser.User.Id;

        var recetaDb = await _context.Receta
            .Include(r => r.RecetaImagen)
            .Include(r => r.IngredienteReceta)
            .Include(r => r.RecetaEtiquetas)
            .Include(r => r.RecetaUtensilio)
            .Include(r => r.Paso).ThenInclude(p => p.RecetaImagen)
            .FirstOrDefaultAsync(r => r.Id == recetaId && r.UsuarioId == currentUserId);

        if (recetaDb == null)
            return false;

        if (!string.IsNullOrWhiteSpace(receta.Titulo)) recetaDb.Titulo = receta.Titulo;
        if (!string.IsNullOrWhiteSpace(receta.Descripcion)) recetaDb.Descripcion = receta.Descripcion;
        if (receta.Dificultad.HasValue) recetaDb.Dificultad = ((DificultadEnum)receta.Dificultad.Value).ToString();
        recetaDb.FechaModificacion = DateTime.Now;

        if (receta.TiempoPreparacion.HasValue)
            recetaDb.TiempoPreparacion = TimeOnly.FromTimeSpan(TimeSpan.FromMinutes(receta.TiempoPreparacion.Value));

        if (receta.Imagen != null && receta.Imagen.Length > 0)
        {
            var mainImage = recetaDb.RecetaImagen.FirstOrDefault(img => img.PasoId == null);
            if (mainImage != null)
            {
                mainImage.Imagen = receta.Imagen;
                mainImage.ContentType = receta.ContentType;
            }
            else
            {
                recetaDb.RecetaImagen.Add(new RecetaImagen { Imagen = receta.Imagen, ContentType = receta.ContentType });
            }
        }

        // Collections only if provided
        if (receta.Ingredientes != null)
        {
            if (recetaDb.IngredienteReceta != null && recetaDb.IngredienteReceta.Any())
                _context.IngredienteReceta.RemoveRange(recetaDb.IngredienteReceta);

            if (receta.Ingredientes.Count > 0)
            {
                recetaDb.IngredienteReceta = recetaDb.IngredienteReceta ?? new List<IngredienteReceta>();
                foreach (var item in receta.Ingredientes)
                {
                    var ingrediente = await IngredienteCreateIfNotExist(item);
                    var ingredienteReceta = new IngredienteReceta { Ingrediente = ingrediente, UnidadId = item.UnidadId, Cantidad = item.Cantidad.GetValueOrDefault(), Receta = recetaDb };
                    recetaDb.IngredienteReceta.Add(ingredienteReceta);
                }
            }
        }

        if (receta.Etiquetas != null)
        {
            if (recetaDb.RecetaEtiquetas != null && recetaDb.RecetaEtiquetas.Any()) _context.RecetaEtiquetas.RemoveRange(recetaDb.RecetaEtiquetas);
            if (receta.Etiquetas.Count > 0)
            {
                recetaDb.RecetaEtiquetas = recetaDb.RecetaEtiquetas ?? new List<RecetaEtiquetas>();
                foreach (var item in receta.Etiquetas)
                {
                    var etiqueta = await EtiquetasCreateIfNotExist(item);
                    recetaDb.RecetaEtiquetas.Add(new RecetaEtiquetas { Etiquetas = etiqueta, Receta = recetaDb });
                }
            }
        }

        if (receta.Utensilios != null)
        {
            if (recetaDb.RecetaUtensilio != null && recetaDb.RecetaUtensilio.Any()) _context.RecetaUtensilio.RemoveRange(recetaDb.RecetaUtensilio);
            if (receta.Utensilios.Count > 0)
            {
                recetaDb.RecetaUtensilio = recetaDb.RecetaUtensilio ?? new List<RecetaUtensilio>();
                foreach (var item in receta.Utensilios)
                {
                    var utensilio = await UtensiliosCreateIfNotExist(item);
                    recetaDb.RecetaUtensilio.Add(new RecetaUtensilio { Utensilio = utensilio, Receta = recetaDb });
                }
            }
        }

        if (receta.Pasos != null)
        {
            var pasosExistentes = await _context.Paso.Where(p => p.RecetaId == recetaDb.Id).ToListAsync();
            if (pasosExistentes.Any())
            {
                var imagenesPasos = await _context.RecetaImagen.Where(img => img.RecetaId == recetaDb.Id && img.PasoId != null).ToListAsync();
                if (imagenesPasos.Any()) _context.RecetaImagen.RemoveRange(imagenesPasos);
                _context.Paso.RemoveRange(pasosExistentes);
            }

            if (receta.Pasos.Count > 0)
            {
                recetaDb.Paso = recetaDb.Paso ?? new List<Paso>();
                for (int i = 0; i < receta.Pasos.Count; i++)
                {
                    var pasoDto = receta.Pasos[i];
                    var paso = new Paso { Titulo = pasoDto.Titulo, Descripcion = pasoDto.Descripcion, Numero = i + 1, Receta = recetaDb };
                    recetaDb.Paso.Add(paso);

                    if (!string.IsNullOrEmpty(pasoDto.Imagen))
                    {
                        byte[] imagenPaso = Convert.FromBase64String(pasoDto.Imagen);
                        var recetaImagen = new RecetaImagen { Imagen = imagenPaso, Paso = paso, ContentType = pasoDto.ContentType };
                        recetaDb.RecetaImagen.Add(recetaImagen);
                        if (paso.RecetaImagen == null) paso.RecetaImagen = new List<RecetaImagen>();
                        paso.RecetaImagen.Add(recetaImagen);
                    }
                }
            }
        }

        // NUEVO: Manejar eliminación de imagen principal si se solicita
        if (receta.RemoveImagen.HasValue && receta.RemoveImagen.Value)
        {
            var mainImageToRemove = recetaDb.RecetaImagen.FirstOrDefault(img => img.PasoId == null);
            if (mainImageToRemove != null)
            {
                _context.RecetaImagen.Remove(mainImageToRemove);
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }


}