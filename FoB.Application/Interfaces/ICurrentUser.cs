using FoB.Application.Dtos;

namespace FoB.Application.Interfaces
{
    public interface ICurrentUser
    {
        UsuarioDto User { get; }
        bool IsInRole(string roleName);
    }
}