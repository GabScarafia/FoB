using FoB.Infrastructure.Context;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Repositories;

public class UserRepository : IUserRepository
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

    // Seguir Usuario
    public async Task FollowUserAsync(int followerId, int followedId)
    {
        var existingFollow = await _context.SeguimientoUsuario
            .FirstOrDefaultAsync(s => s.SeguidorId == followerId && s.SeguidoId == followedId);

        if (existingFollow == null)
        {
            var newFollow = new SeguimientoUsuario
            {
                SeguidorId = followerId,
                SeguidoId = followedId,
                FechaSeguimiento = DateTime.Now
            };
            await _context.SeguimientoUsuario.AddAsync(newFollow);
        }
    }

    public async Task UnfollowUserAsync(int followerId, int followedId)
    {
        var existingFollow = await _context.SeguimientoUsuario
            .FirstOrDefaultAsync(s => s.SeguidorId == followerId && s.SeguidoId == followedId);

        if (existingFollow != null)
        {
            _context.SeguimientoUsuario.Remove(existingFollow);
        }
    }

    public async Task<bool> IsFollowingAsync(int followerId, int followedId)
    {
        return await _context.SeguimientoUsuario
            .AnyAsync(s => s.SeguidorId == followerId && s.SeguidoId == followedId);
    }
}