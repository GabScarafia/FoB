using System.Threading.Tasks;
using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Interface;
using System;

namespace FoB.Infrastructure.Services
{
    public class UsuarioPerfilService : IUsuarioPerfilService
    {
        private readonly IUserRepository _userRepository;

        public UsuarioPerfilService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<UsuarioPerfilDto> ObtenerPerfilUsuarioAsync(int idUsuario)
        {
            var usuario = await _userRepository.GetPerfilByIdAsync(idUsuario);

            if (usuario == null)
            {
                return null;
            }

            var perfilDto = new UsuarioPerfilDto
            {
                Id = usuario.Id,
                NombreUsuario = usuario.NombreUsuario,
                NombreCompleto = $"{usuario.Nombre} {usuario.Apellido}",
                Biografia = usuario.Biografia,
                // Lógica para la imagen como Base64
                FotoPerfilBase64 = usuario.UsuarioImagen?.FirstOrDefault()?.Imagen != null
                    ? Convert.ToBase64String(usuario.UsuarioImagen.FirstOrDefault().Imagen)
                    : null,
                CantidadPublicaciones = usuario.Receta.Count(),
                CantidadSeguidores = usuario.SeguimientoUsuarioSeguido.Count(),
                CantidadSeguidos = usuario.SeguimientoUsuarioSeguidor.Count()
            };

            return perfilDto;
        }
    }
}