using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Application.Dtos;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System; // Asegúrate de incluir esta importación

namespace FoB.Infrastructure.Repository
{
    public class BusquedaRepository : IBusquedaRepository
    {
        private readonly fobContext _contexto;
        private readonly ICurrentUser _currentUser;

        public BusquedaRepository(fobContext contexto, ICurrentUser currentUser)
        {
            _contexto = contexto;
            _currentUser = currentUser;
        }

        public async Task<List<UsuarioBusquedaDto>> BuscarUsuariosAsync(string termino)
        {
            var currentUserId = _currentUser.User?.Id;
            var usuariosEncontrados = await _contexto.Usuario
                .Include(u => u.UsuarioImagen)
                .Where(u => u.Nombre.Contains(termino) ||
                            u.Apellido.Contains(termino) ||
                            u.NombreUsuario.Contains(termino))
                .ToListAsync();

            if (currentUserId.HasValue)
            {
                var followedUserIds = await _contexto.SeguimientoUsuario
                    .Where(s => s.SeguidorId == currentUserId.Value)
                    .Select(s => s.SeguidoId)
                    .ToListAsync();

                return usuariosEncontrados.Select(u => new UsuarioBusquedaDto
                {
                    Id = u.Id,
                    Nombre = u.Nombre,
                    Apellido = u.Apellido,
                    NombreUsuario = u.NombreUsuario,
                    Imagen = u.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault()?.Imagen != null
                             ? Convert.ToBase64String(u.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault()?.Imagen)
                             : null, // Condición para manejar imágenes nulas
                    IsFollowing = followedUserIds.Contains(u.Id)
                }).ToList();
            }

            return usuariosEncontrados.Select(u => new UsuarioBusquedaDto
            {
                Id = u.Id,
                Nombre = u.Nombre,
                Apellido = u.Apellido,
                NombreUsuario = u.NombreUsuario,
                Imagen = u.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault()?.Imagen != null
                         ? Convert.ToBase64String(u.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault()?.Imagen)
                         : null, // Condición para manejar imágenes nulas
                IsFollowing = false
            }).ToList();
        }
    }
}