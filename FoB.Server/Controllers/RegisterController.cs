using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoB.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class RegisterController : ControllerBase
{
    private readonly IRegisterService _registerService;
    private readonly ILogger<RegisterController> _logger;

    public RegisterController(ILogger<RegisterController> logger, IRegisterService registerService)
    {
        _logger = logger;
        _registerService = registerService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] UsuarioDtoRegisterRequest request)
    {
        if (request == null)
        {
            _logger.LogWarning("Intento de registro con request nula.");
            return BadRequest("El cuerpo de la solicitud no puede ser nulo.");
        }

        if (!ModelState.IsValid)
        {
            // Devuelve un 400 Bad Request con los errores de validación del modelo
            return BadRequest(ModelState);
        }

        try
        {
            // El servicio devuelve true o false
            bool success = await _registerService.RegisterUser(request);

            if (success)
            {
                _logger.LogInformation("Usuario {Email} registrado exitosamente.", request.Email);
                // Si el registro fue exitoso, devolvemos un 200 OK
                return Ok("Usuario registrado exitosamente. Por favor, inicie sesión.");
            }
            else
            {
                _logger.LogWarning("Fallo en el registro para el email {Email}.", request.Email);
                // Si el servicio devuelve false, implica un fallo de negocio (ej. email ya existe, contraseña débil)
                return BadRequest("El registro falló. Verifique sus datos o intente más tarde.");
            }
        }
        catch (Exception ex)
        {
            // Capturamos cualquier excepción inesperada y devolvemos un 500 Internal Server Error
            _logger.LogError(ex, "Error interno inesperado al intentar registrar el usuario {Email}.", request.Email);
            return StatusCode(500, "Ocurrió un error interno del servidor.");
        }
    }
}