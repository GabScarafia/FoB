// FoB.Infrastructure/Repositories/IUserRepository.cs
using FoB.Infrastructure.Models;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Repositories;

public interface IUserRepository
{
    Task<bool> EmailExistsAsync(string email);
    Task<bool> UsernameExistsAsync(string username);
    Task AddAsync(Usuario user);
    Task SaveChangesAsync();
}