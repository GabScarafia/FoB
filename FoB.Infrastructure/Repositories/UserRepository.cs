using FoB.Infrastructure.Context;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Repositories;

internal sealed class UserRepository : IUserRepository
{
    private readonly fobContext _context;
    public UserRepository(fobContext context)
    {
        _context = context;
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Usuario.AnyAsync(u => u.Email == email);
    }

    public async Task<bool> UsernameExistsAsync(string username)
    {
        return await _context.Usuario.AnyAsync(u => u.NombreUsuario == username);
    }

    public async Task AddAsync(Usuario user)
    {
        await _context.Usuario.AddAsync(user);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<Rol> GetRoleByNameAsync(string roleName)
    {
        return await _context.Rol.FirstOrDefaultAsync(r => r.Nombre == roleName);
    }
}