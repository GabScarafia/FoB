// src/FoB.Infrastructure/Repositories/ComentarioRepository.cs
using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System; // Necesario para DateTime.Now
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Repositories
{
    public class ComentarioRepository : IComentarioRepository
    {
        private readonly fobContext _context;
        private readonly ICurrentUser _currentUser; // Asegúrate de que ICurrentUser se está inyectando correctamente

        public ComentarioRepository(fobContext context, ICurrentUser currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        // --- MÉTODO EXISTENTE: Obtener Comentarios por Receta (ya mapea Usuario.Id) ---
        public async Task<IEnumerable<ComentarioDTO>> GetByRecetaAsync(int idReceta)
        {
            var comentarios = await _context.Set<Comentario>()
                .Include(x => x.Usuario)
                    .ThenInclude(x => x.UsuarioImagen)
                .Where(c => c.RecetaId == idReceta)
                .Select(c => new ComentarioDTO
                {
                    Id = c.Id,
                    IdReceta = c.RecetaId,
                    Texto = c.Texto,
                    Fecha = c.Fecha,
                    RespuestaAComentarioId = c.RespuestaAComentarioId,
                    Usuario = new UsuarioComentarioDTO
                    {
                        Id = c.Usuario.Id, // ¡Perfecto, ya tienes el ID del usuario aquí!
                        Nombre = c.Usuario.Nombre,
                        Apellido = c.Usuario.Apellido,
                        NombreUsuario = c.Usuario.NombreUsuario,
                        Imagen = c.Usuario.UsuarioImagen.FirstOrDefault().Imagen,
                    },
                    Respuestas = new List<ComentarioDTO>() // Mantienes la estructura anidada aquí
                }).ToListAsync();

            // Lógica para anidar comentarios (la que ya tienes)
            var comentarioMap = comentarios.ToDictionary(c => c.Id);
            var comentariosPadre = new List<ComentarioDTO>();

            foreach (var comentario in comentarios.OrderBy(c => c.Fecha))
            {
                if (comentario.RespuestaAComentarioId.HasValue && comentarioMap.ContainsKey(comentario.RespuestaAComentarioId.Value))
                {
                    var padre = comentarioMap[comentario.RespuestaAComentarioId.Value];
                    if (padre.Respuestas == null)
                    {
                        padre.Respuestas = new List<ComentarioDTO>();
                    }
                    padre.Respuestas.Add(comentario);
                }
                else
                {
                    comentariosPadre.Add(comentario);
                }
            }

            return comentariosPadre;
        }

        // --- NUEVO MÉTODO: Obtener un Comentario por ID (para el controlador) ---
        public async Task<ComentarioDTO> GetByIdAsync(int id)
        {
            var comentario = await _context.Set<Comentario>()
                .Include(x => x.Usuario)
                    .ThenInclude(x => x.UsuarioImagen)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comentario == null) return null;

            return new ComentarioDTO
            {
                Id = comentario.Id,
                IdReceta = comentario.RecetaId,
                Texto = comentario.Texto,
                Fecha = comentario.Fecha,
                RespuestaAComentarioId = comentario.RespuestaAComentarioId,
                Usuario = new UsuarioComentarioDTO
                {
                    Id = comentario.Usuario.Id, // ¡Mapeo del ID del usuario aquí!
                    Nombre = comentario.Usuario.Nombre,
                    Apellido = comentario.Usuario.Apellido,
                    NombreUsuario = comentario.Usuario.NombreUsuario,
                    Imagen = comentario.Usuario.UsuarioImagen.FirstOrDefault()?.Imagen,
                },
                // No necesitamos cargar respuestas anidadas para GetByIdAsync,
                // ya que solo lo usamos para verificar el autor en el controlador.
                Respuestas = new List<ComentarioDTO>()
            };
        }

        // --- MÉTODO EXISTENTE: Agregar Comentario (ya mapea Usuario.Id) ---
        public async Task<ComentarioDTO> AddAsync(ComentarioCreateDTO comentarioDto)
        {
            var comentarioInfra = new FoB.Infrastructure.Models.Comentario
            {
                RecetaId = comentarioDto.IdReceta,
                Fecha = System.DateTime.Now,
                Texto = comentarioDto.Texto,
                UsuarioId = _currentUser.User.Id,
                RespuestaAComentarioId = comentarioDto.IdComentario
            };

            _context.Comentario.Add(comentarioInfra);
            await _context.SaveChangesAsync();

            var usuario = await _context.Set<FoB.Infrastructure.Models.Usuario>()
                .Include(u => u.UsuarioImagen)
                .FirstOrDefaultAsync(u => u.Id == _currentUser.User.Id);

            var nuevoComentarioDTO = new ComentarioDTO
            {
                Id = comentarioInfra.Id,
                IdReceta = comentarioInfra.RecetaId,
                Texto = comentarioInfra.Texto,
                Fecha = comentarioInfra.Fecha,
                RespuestaAComentarioId = comentarioInfra.RespuestaAComentarioId,
                Usuario = new UsuarioComentarioDTO
                {
                    Id = usuario.Id, // ¡Perfecto, ya tienes el ID del usuario aquí también!
                    Nombre = usuario.Nombre,
                    Apellido = usuario.Apellido,
                    NombreUsuario = usuario.NombreUsuario,
                    Imagen = usuario.UsuarioImagen.FirstOrDefault()?.Imagen,
                },
                Respuestas = new List<ComentarioDTO>()
            };

            // Crear notificación para el autor de la receta
            try
            {
                var receta = await _context.Receta.Include(r => r.Usuario).FirstOrDefaultAsync(r => r.Id == comentarioInfra.RecetaId);
                if (receta != null && receta.UsuarioId != _currentUser.User.Id)
                {
                    var actor = usuario; // el que comentó
                    var noti = new Notificacion
                    {
                        FechaDeEnvio = DateTime.UtcNow,
                        Leida = false,
                        Mensaje = $"{actor?.NombreUsuario ?? "Alguien"} comentó tu publicación",
                        Tipo = "Nuevo Comentario",
                        UrlEnlace = $"/perfil/{receta.UsuarioId}/publicaciones?receta={receta.Id}&comentario={comentarioInfra.Id}",
                        UsuarioId = receta.UsuarioId
                    };
                    _context.Notificacion.Add(noti);
                    noti.EmisorId = usuario.Id;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.ToString());
            }

            return nuevoComentarioDTO;
        }

        // --- NUEVO MÉTODO: Eliminación Lógica de Comentario ---
        public async Task DeleteAsync(int id)
        {
            var comentario = await _context.Comentario.FindAsync(id);
            if (comentario != null)
            {
                comentario.Texto = "Comentario eliminado";
                comentario.FechaModificacion = DateTime.Now;
                // NO TOCAMOS comentario.UsuarioId, para que su nombre de usuario se mantenga
                await _context.SaveChangesAsync();
            }
        }

        public async Task<ComentarioDTO> UpdateAsync(int id, ComentarioUpdateDTO dto) // Para modificar Comentarios
        {
            var comentario = await _context.Comentario
                .Include(c => c.Usuario)
                .ThenInclude(u => u.UsuarioImagen)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comentario == null) return null;

            // Verificamos que el usuario actual sea el autor
            if (comentario.UsuarioId != _currentUser.User.Id)
            {
                throw new UnauthorizedAccessException("No tenés permiso para modificar este comentario.");
            }

            comentario.Texto = dto.Texto;
            comentario.FechaModificacion = DateTime.Now;

            await _context.SaveChangesAsync();

            return new ComentarioDTO
            {
                Id = comentario.Id,
                IdReceta = comentario.RecetaId,
                Texto = comentario.Texto,
                Fecha = comentario.Fecha,
                RespuestaAComentarioId = comentario.RespuestaAComentarioId,
                Usuario = new UsuarioComentarioDTO
                {
                    Id = comentario.Usuario.Id,
                    Nombre = comentario.Usuario.Nombre,
                    Apellido = comentario.Usuario.Apellido,
                    NombreUsuario = comentario.Usuario.NombreUsuario,
                    Imagen = comentario.Usuario.UsuarioImagen.FirstOrDefault()?.Imagen
                },
                Respuestas = new List<ComentarioDTO>() // No incluimos anidamiento aquí
            };
        }



    }
}