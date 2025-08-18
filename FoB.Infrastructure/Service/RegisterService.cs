using FoB.Application.Dtos;
using FoB.Application.Interfaces; // Para IRegisterService
using FoB.Infrastructure.Models; // Para la entidad Usuario de EF Core
using FoB.Infrastructure.Repositories; // Para IUserRepository
using Microsoft.Extensions.Logging;
using static BCrypt.Net.BCrypt; // Para hashear contraseñas (necesitas instalar el paquete NuGet BCrypt.Net.Core)
using System; // Para DateOnly.FromDateTime

namespace FoB.Infrastructure.Service // Namespace que te generó Visual Studio
{
    // Asegúrate de que esta clase sea 'public' para que el contenedor de DI pueda acceder a ella
    public class RegisterService : IRegisterService
    {
        private readonly ILogger<RegisterService> _logger;
        private readonly IUserRepository _userRepository;

        public RegisterService(ILogger<RegisterService> logger, IUserRepository userRepository)
        {
            _logger = logger;
            _userRepository = userRepository;
        }

        public async Task<bool> RegisterUser(UsuarioDtoRegisterRequest request)
        {
            // 1. Validaciones
            // Aunque el controlador pueda tener Data Annotations, el servicio debe revalidar
            // los datos esenciales y la lógica de negocio.
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Apellido) ||
                string.IsNullOrWhiteSpace(request.NombreUsuario))
            {
                _logger.LogWarning("Intento de registro con datos incompletos.");
                return false; // Indica fallo
            }

            // Validación de email ya existente
            try
            {
                if (await _userRepository.EmailExistsAsync(request.Email))
                {
                    _logger.LogWarning("Intento de registro con email ya existente: {Email}", request.Email);
                    return false; // Indica fallo
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar existencia de email en la base de datos para {Email}.", request.Email);
                return false; // Fallo debido a error en la BD
            }


            // Validación de nombre de usuario ya existente
            try
            {
                if (await _userRepository.UsernameExistsAsync(request.NombreUsuario))
                {
                    _logger.LogWarning("Intento de registro con nombre de usuario ya existente: {NombreUsuario}", request.NombreUsuario);
                    return false; // Indica fallo
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar existencia de nombre de usuario en la base de datos para {NombreUsuario}.", request.NombreUsuario);
                return false; // Fallo debido a error en la BD
            }


            // Validación de contraseñas coincidentes (aunque [Compare] en el DTO lo maneja a nivel de controlador)
            if (request.Password != request.ConfirmPassword)
            {
                _logger.LogWarning("Las contraseñas no coinciden para el registro del email: {Email}", request.Email);
                return false; // Indica fallo
            }

            // Aquí podrías añadir validaciones de complejidad de contraseña
            // (longitud mínima, requerir mayúsculas/minúsculas/números/símbolos, etc.)
            // Si la contraseña no es suficientemente compleja:
            // if (!IsPasswordStrongEnough(request.Password)) { return false; }


            // 2. Creación y persistencia del usuario
            try
            {
                // Hashear la contraseña antes de guardarla. ¡Esto es crucial!
                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

                var newUser = new Usuario
                {
                    Nombre = request.Nombre,
                    Apellido = request.Apellido,
                    NombreUsuario = request.NombreUsuario,
                    Email = request.Email,
                    Contrasena = hashedPassword, // Guarda la contraseña hasheada
                    Activo = true, // Por defecto, el usuario está activo al registrarse
                    FechaRegistro = DateOnly.FromDateTime(DateTime.UtcNow), // Guarda la fecha de registro
                    Biografia = null, // Inicialmente nulo
                    ImagenPerfil = null // Inicialmente nulo
                    // Las colecciones de navegación (Comentarios, MensajePrivado, etc.) se inicializarán por defecto o se añadirán más tarde
                };

                await _userRepository.AddAsync(newUser); // Agrega el nuevo usuario al contexto de EF Core
                await _userRepository.SaveChangesAsync(); // Guarda los cambios en la base de datos

                _logger.LogInformation("Usuario {Email} registrado exitosamente.", request.Email);
                return true; // Éxito en el registro
            }
            catch (Exception ex)
            {
                // Captura cualquier error durante la persistencia en la base de datos
                _logger.LogError(ex, "Error crítico al registrar el usuario {Email} en la base de datos.", request.Email);
                return false; // Indica fallo
            }
        }
    }
}