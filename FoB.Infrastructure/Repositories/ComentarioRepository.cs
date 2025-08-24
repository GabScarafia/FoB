using FoB.Application.Dtos;
using FoB.Application.Entities;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
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
            return await _context.Set<Comentario>()
                .Include(x=>x.Usuario)
                    .ThenInclude(x=>x.UsuarioImagen)
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
                    }
                }).ToListAsync();
        }

        public async Task<Application.Entities.ComentarioRequest> AddAsync(Application.Entities.ComentarioRequest comentario)
        {
            // Si necesitas convertir de FoB.Application.Entities.Comentario a FoB.Infrastructure.Models.Comentario,
            // realiza el mapeo aquí. Ejemplo:

            var receta = await _context.Receta.FirstOrDefaultAsync(x=>x.Id == comentario.RecetaId);
            var recetas = await _context.Receta.ToListAsync();
            
            var comentarioInfra = new FoB.Infrastructure.Models.Comentario
            {
                // Asigna las propiedades necesarias desde 'comentario' (de Entities) a 'comentarioInfra' (de Model
                RecetaId = comentario.RecetaId,
                Fecha = DateTime.Now,
                Texto = comentario.Texto,
                FechaModificacion = comentario.FechaModificacion,
                UsuarioId = _currentUser.User.Id,
                RespuestaAComentarioId = comentario.RespuestaAComentarioId
                // Agrega otras propiedades si es necesario
            };

            _context.Comentario.Add(comentarioInfra);
            await _context.SaveChangesAsync();
            return comentario; // O regresa el objeto de Models si tu interfaz lo requiere
        }

    }
}
