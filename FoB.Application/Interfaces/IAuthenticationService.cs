using FoB.Application.Dtos;

namespace FoB.Application.Interfaces;

public interface IAuthenticationService
{

    public Task<UsuarioDto> Login(string email, string password);

}
