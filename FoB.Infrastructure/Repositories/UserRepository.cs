using FoB.Application.Dtos;
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

    public async Task<UsuarioComentarioDTO> GetUsuarioComentarioByIdAsync(long id)
    {
        var result = await _context.Usuario.Include(u => u.UsuarioRol).Include(u => u.UsuarioImagen).FirstOrDefaultAsync(u => u.Id ==id);
        if (result == null) return null;
        return new UsuarioComentarioDTO
        {
            Nombre = result.Nombre,
            Apellido = result.Apellido,
            NombreUsuario = result.NombreUsuario,
            Imagen = result.UsuarioImagen.FirstOrDefault()?.Imagen
        };
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