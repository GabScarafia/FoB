// FoB.Infrastructure/Repositories/IUserRepository.cs
using FoB.Infrastructure.Models;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Interface;

public interface IUserRepository
{
    Task<bool> EmailExistsAsync(string email);
    Task<bool> UsernameExistsAsync(string username);
    Task<UsuarioComentarioDTO> GetUsuarioComentarioByIdAsync(long id);
    Task AddAsync(Usuario user);
    Task SaveChangesAsync();
    Task<Rol> GetRoleByNameAsync(string roleName);

    // Seguir usuario
    Task FollowUserAsync(int followerId, int followedId);
    Task UnfollowUserAsync(int followerId, int followedId);
    Task<bool> IsFollowingAsync(int followerId, int followedId);
}