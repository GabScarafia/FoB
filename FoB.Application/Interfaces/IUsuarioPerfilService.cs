using System.Threading.Tasks;
using FoB.Application.Dtos;

namespace FoB.Application.Interfaces
{
    public interface IUsuarioPerfilService
    {
        Task<UsuarioPerfilDto> ObtenerPerfilUsuarioAsync(int idUsuario, int? idUsuarioActual = null);
    }
}