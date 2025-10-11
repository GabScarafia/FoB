using System.ComponentModel.DataAnnotations;

namespace FoB.Application.Dtos
{
    public class UsuarioUpdateDto
    {
        public int Id { get; set; }

        [Required]
        public string Nombre { get; set; }

        [Required]
        public string Apellido { get; set; }

        [Required]
        public string NombreUsuario { get; set; }

        public string Biografia { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string? Contrasena { get; set; }

        public string? FotoPerfilBase64 { get; set; }
    }
}