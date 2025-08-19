using FoB.Application.Entities;

namespace FoB.Application.Dtos;

public class UsuarioDtoRequest
{
    public string Password { get; set; }
    public string Email { get; set; }
}
public class UsuarioDto
{
    public int Id { get; set; }
    public string Token { get; set; }
    public DateTime ExpDate { get; set; }
    public string Nombre { get; set; }

    public string Apellido { get; set; }

    public string NombreUsuario { get; set; }
    public string Email { get; set; }
    public List<string> Roles { get; set; }
}
