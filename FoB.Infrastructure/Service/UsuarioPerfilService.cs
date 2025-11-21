using System.Threading.Tasks;
using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Interface;
using System;
using System.Linq; // Necesario para usar .FirstOrDefault() y .Count() en el mapeo, y .Any() en la lógica de seguimiento
using FoB.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FoB.Infrastructure.Services
{
    public class UsuarioPerfilService : IUsuarioPerfilService
    {
        private readonly IUserRepository _userRepository;
        private readonly fobContext _context;

        public UsuarioPerfilService(IUserRepository userRepository, fobContext context)
        {
            _userRepository = userRepository;
            _context = context;
        }

        // Se modifica la firma para aceptar 'idUsuarioActual' como parámetro opcional.
        // Esto mantiene la compatibilidad con la interfaz que solo pide 'idUsuario'.
        public async Task<UsuarioPerfilDto> ObtenerPerfilUsuarioAsync(int idUsuario, int? idUsuarioActual = null)
        {
            // Proyectamos directamente desde la BD para evitar cargar los BLOBs (Imagen byte[])
            var perfil = await _context.Usuario
                .AsNoTracking()
                .Where(u => u.Id == idUsuario)
                .Select(u => new UsuarioPerfilDto
                {
                    Id = u.Id,
                    Nombre = u.Nombre,
                    Apellido = u.Apellido,
                    Email = u.Email,
                    NombreUsuario = u.NombreUsuario,
                    Biografia = u.Biografia,

                    // Construimos la URL usando el Id de la imagen sin traer el byte[]
                    FotoPerfilUrl = u.UsuarioImagen
                        .OrderByDescending(ui => ui.Id)
                        .Select(ui => "/api/archivos/usuario/" + ui.Id)
                        .FirstOrDefault(),

                    // Contamos en SQL en vez de materializar colecciones
                    CantidadPublicaciones = u.Receta.Count(r => r.Activa == true),
                    CantidadSeguidores = u.SeguimientoUsuarioSeguido.Count(),
                    CantidadSeguidos = u.SeguimientoUsuarioSeguidor.Count(),

                    // Publicaciones: proyectamos solo campos necesarios (ids de imagen y contentType)
                    Publicaciones = u.Receta
                        .Where(r => r.Activa == true)
                        .OrderByDescending(r => r.Id)
                        .Select(r => new RecetaDto
                        {
                            Id = r.Id,
                            Titulo = r.Titulo,
                            ImagenPrincipalUrl = r.RecetaImagen
                                .Where(img => img.PasoId == null)
                                .OrderByDescending(img => img.Id)
                                .Select(img => "/api/archivos/receta/" + img.Id)
                                .FirstOrDefault(),
                            ContentType = r.RecetaImagen
                                .OrderByDescending(img => img.Id)
                                .Select(img => img.ContentType)
                                .FirstOrDefault()
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (perfil == null)
                return null;

            // Determinar si el usuario actual sigue a este usuario (comprobar en BD)
            bool esSeguido = false;
            if (idUsuarioActual.HasValue && idUsuarioActual.Value != idUsuario)
            {
                esSeguido = await _context.SeguimientoUsuario
                    .AsNoTracking()
                    .AnyAsync(s => s.SeguidorId == idUsuarioActual.Value && s.SeguidoId == idUsuario);
            }

            perfil.EsSeguido = esSeguido;

            return perfil;
        }
    }
}