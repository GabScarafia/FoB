using FoB.Infrastructure.Interface; // Importa la interfaz del repositorio
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FoB.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class FollowController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public FollowController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
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