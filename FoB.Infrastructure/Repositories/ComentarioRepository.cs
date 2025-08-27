// src/FoB.Infrastructure/Repositories/ComentarioRepository.cs
using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Repositories
{
    public class ComentarioRepository : IComentarioRepository
    {
        private readonly fobContext _context;
        private readonly ICurrentUser _currentUser;

        public ComentarioRepository(fobContext context, ICurrentUser currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

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
                        Nombre = c.Usuario.Nombre,
                        Apellido = c.Usuario.Apellido,
                        NombreUsuario = c.Usuario.NombreUsuario,
                        Imagen = c.Usuario.UsuarioImagen.FirstOrDefault().Imagen,
                    },
                    Respuestas = new List<ComentarioDTO>()
                }).ToListAsync();

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
                // CORRECCIÓN: Aquí es donde estaba el error. Usamos 'RespuestaAComentarioId'
                RespuestaAComentarioId = comentarioInfra.RespuestaAComentarioId,
                Usuario = new UsuarioComentarioDTO
                {
                    Nombre = usuario.Nombre,
                    Apellido = usuario.Apellido,
                    NombreUsuario = usuario.NombreUsuario,
                    Imagen = usuario.UsuarioImagen.FirstOrDefault()?.Imagen,
                },
                Respuestas = new List<ComentarioDTO>()
            };

            return nuevoComentarioDTO;
        }
    }
}