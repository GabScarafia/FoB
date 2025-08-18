using System.ComponentModel.DataAnnotations;

namespace FoB.Application.Dtos;

public class UsuarioDtoRegisterRequest
{
    // Campos de usuario
    [Required(ErrorMessage = "El nombre es requerido.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    public string Nombre { get; set; }

    [Required(ErrorMessage = "El apellido es requerido.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El apellido debe tener entre 2 y 100 caracteres.")]
    public string Apellido { get; set; }

    [Required(ErrorMessage = "El nombre de usuario es requerido.")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "El nombre de usuario debe tener entre 3 y 50 caracteres.")]
    // Aca podemos agregar una expresion regular
    public string NombreUsuario { get; set; }

    [Required(ErrorMessage = "El email es requerido.")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido.")]
    [StringLength(255, ErrorMessage = "El email no puede exceder los 255 caracteres.")]
    public string Email { get; set; }

    // Campos de seguridad
    [Required(ErrorMessage = "La contraseña es requerida.")]
    [StringLength(100, MinimumLength = 4, ErrorMessage = "La contraseña debe tener al menos 4 caracteres.")]
    // [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$",
    //    ErrorMessage = "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial.")]
    public string Password { get; set; }

    [Required(ErrorMessage = "La confirmación de la contraseña es requerida.")]
    [Compare("Password", ErrorMessage = "La contraseña y la confirmación no coinciden.")]
    public string ConfirmPassword { get; set; }
}