using FoB.Application.Dtos;

namespace FoB.Application.Interfaces;

public interface IRegisterService
{

    Task<bool> RegisterUser(UsuarioDtoRegisterRequest request);
}