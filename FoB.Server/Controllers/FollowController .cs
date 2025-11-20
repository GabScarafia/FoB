using FoB.Infrastructure.Interface; // Importa la interfaz del repositorio
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;

namespace FoB.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class FollowController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly fobContext _context;

        public FollowController(IUserRepository userRepository, fobContext context)
        {
            _userRepository = userRepository;
            _context = context;
        }

        // Helper para obtener el ID del usuario del token
        private int? GetCurrentUserId()
        {
            // Busca el claim personalizado "id"
            var userIdClaim = User.FindFirstValue("id");
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }

        [HttpPost("{followedId}")]
        public async Task<IActionResult> FollowUser(int followedId)
        {
            var followerId = GetCurrentUserId();
            if (!followerId.HasValue)
            {
                return Unauthorized(new { message = "ID de usuario no válido." });
            }

            await _userRepository.FollowUserAsync(followerId.Value, followedId);
            await _userRepository.SaveChangesAsync();

            try
            {
                // Crear notificación para el usuario seguido
                var follower = await _context.Usuario.FirstOrDefaultAsync(u => u.Id == followerId.Value);
                if (follower != null)
                {
                    var noti = new Notificacion
                    {
                        FechaDeEnvio = DateTime.Now,
                        Leida = false,
                        Mensaje = $"{follower.NombreUsuario} te empezó a seguir",
                        Tipo = "Nuevo Seguidor",
                        UrlEnlace = $"/perfil/{followerId.Value}",
                        UsuarioId = followedId
                    };
                    _context.Notificacion.Add(noti);
                    await _context.SaveChangesAsync();

                    // asignar EmisorId
                    noti.EmisorId = followerId.Value;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                // No fallar la acción principal por un error en notificación
                Console.Error.WriteLine(ex.ToString());
            }

            return Ok(new { message = "Usuario seguido exitosamente." });
        }

        [HttpDelete("{followedId}")]
        public async Task<IActionResult> UnfollowUser(int followedId)
        {
            var followerId = GetCurrentUserId();
            if (!followerId.HasValue)
            {
                return Unauthorized(new { message = "ID de usuario no válido." });
            }

            await _userRepository.UnfollowUserAsync(followerId.Value, followedId);
            await _userRepository.SaveChangesAsync();

            return Ok(new { message = "Usuario dejado de seguir exitosamente." });
        }

        [HttpGet("isFollowing/{followedId}")]
        public async Task<IActionResult> IsFollowing(int followedId)
        {
            var followerId = GetCurrentUserId();
            if (!followerId.HasValue)
            {
                return Unauthorized(new { message = "ID de usuario no válido." });
            }

            var isFollowing = await _userRepository.IsFollowingAsync(followerId.Value, followedId);

            return Ok(isFollowing);
        }
    }
}