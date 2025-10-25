using System.Threading.Tasks;
using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Interface;
using System;
using System.Linq; // Necesario para usar .FirstOrDefault() y .Count() en el mapeo, y .Any() en la lógica de seguimiento

namespace FoB.Infrastructure.Services
{
    public class UsuarioPerfilService : IUsuarioPerfilService
    {
        private readonly IUserRepository _userRepository;

        public UsuarioPerfilService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // Se modifica la firma para aceptar 'idUsuarioActual' como parámetro opcional.
        // Esto mantiene la compatibilidad con la interfaz que solo pide 'idUsuario'.
        public async Task<UsuarioPerfilDto> ObtenerPerfilUsuarioAsync(int idUsuario, int? idUsuarioActual = null)
        {
            var usuario = await _userRepository.GetPerfilByIdAsync(idUsuario);

            if (usuario == null)
            {
                return null;
            }

            // * Lógica para calcular el estado de seguimiento *
            bool esSeguido = false;

            // Solo verificamos si hay un usuario actual logueado y si NO está viendo su propio perfil
            if (idUsuarioActual.HasValue && idUsuarioActual.Value != idUsuario)
            {
                // Verifica si el ID del usuario actual está entre los seguidores de este perfil
                if (usuario.SeguimientoUsuarioSeguido != null)
                {
                    esSeguido = usuario.SeguimientoUsuarioSeguido
                        .Any(s => s.SeguidorId == idUsuarioActual.Value);
                }
            }


            var perfilDto = new UsuarioPerfilDto
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Apellido = usuario.Apellido,
                Email = usuario.Email,
                NombreUsuario = usuario.NombreUsuario,
                Biografia = usuario.Biografia,
                // Lógica para la imagen como Base64
                FotoPerfilBase64 = usuario.UsuarioImagen?.FirstOrDefault()?.Imagen != null
                    ? Convert.ToBase64String(usuario.UsuarioImagen.FirstOrDefault().Imagen)
                    : null,
                CantidadPublicaciones = usuario.Receta.Count(),
                CantidadSeguidores = usuario.SeguimientoUsuarioSeguido.Count(),
                CantidadSeguidos = usuario.SeguimientoUsuarioSeguidor.Count(),

                EsSeguido = esSeguido,

            };

            return perfilDto;
        }
    }
}