using FoB.Application.Dtos;
using FoB.Application.Entities.Receta;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System; // Asegúrate de incluir esta importación
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

        public async Task<List<RecetaBusquedaDto>> BuscarRecetasAsync(string termino)
        {
            IQueryable<Receta> query = _contexto.Set<Receta>()
                .Include(x => x.Usuario)
                .Include(x => x.IngredienteReceta)
                    .ThenInclude(x => x.Ingrediente)
                .Where(x => x.Activa == true && x.UsuarioId != _currentUser.User.Id);

            var terminoLimpio = termino.Trim();
            string patronLike = $"%{terminoLimpio}%";

            query = query.Where(x =>
                // Coincidencia por Título
                EF.Functions.Like(x.Titulo, patronLike) ||

                // Coincidencia por Nombre de Usuario
                EF.Functions.Like(x.Usuario.NombreUsuario, patronLike) ||

                // Coincidencia por Nombre de Ingrediente
                x.IngredienteReceta.Any(ir => EF.Functions.Like(ir.Ingrediente.Nombre, patronLike))
            );

            query = query.OrderByDescending(x =>
                    EF.Functions.Like(x.Titulo, patronLike) ? 3 :
                    x.IngredienteReceta.Any(ir => EF.Functions.Like(ir.Ingrediente.Nombre, patronLike)) ? 2 :
                    EF.Functions.Like(x.Usuario.NombreUsuario, patronLike) ? 1 :
                    0
                )
                .ThenByDescending(x => x.FechaCreacion)
                .ThenByDescending(x => x.PuntuacionPromedio)
                .ThenBy(x => x.Titulo); 

            var list = await query.Select(x => new RecetaBusquedaDto
            {
                Id = x.Id,
                Titulo = x.Titulo,
                Autor = new UsuarioResponse
                {
                    Id = x.Usuario.Id,
                    Imagen = x.Usuario.UsuarioImagen.OrderByDescending(img => img.Id).FirstOrDefault().Imagen,
                    NombreUsuario = x.Usuario.NombreUsuario,
                    Nombre = x.Usuario.Nombre,
                    Apellido = x.Usuario.Apellido,
                },
            })
            .ToListAsync();

            return list;
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