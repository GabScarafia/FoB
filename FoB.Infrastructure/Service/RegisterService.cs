using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Models;
using Microsoft.Extensions.Logging;
using static BCrypt.Net.BCrypt;
using System;
using FoB.Infrastructure.Interface;

namespace FoB.Infrastructure.Service
{
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


            // Validación de contraseñas coincidentes
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
                // Hasheo de contraseña
                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

                var newUser = new Usuario
                {
                    Nombre = request.Nombre,
                    Apellido = request.Apellido,
                    NombreUsuario = request.NombreUsuario,
                    Email = request.Email,
                    Contrasena = hashedPassword,
                    Activo = true,
                    FechaRegistro = DateOnly.FromDateTime(DateTime.UtcNow), // Guarda la fecha de registro
                    Biografia = null,
                    ImagenPerfil = null
                };

                // Asignacion de rol
                const string rolName = "Usuario"; // Usuario/Admin/etc.

                // Busco el rol en la base de datos
                var rol = await _userRepository.GetRoleByNameAsync(rolName);

                if (rol == null)
                {
                    _logger.LogError("El rol predeterminado '{rol}' no se encontró en la base de datos. No se pudo registrar al usuario.", rol);
                    return false;
                }

                // Asigno el rol al usuario
                UsuarioRol usuarioRol = new()
                {
                    RolId = rol.Id,
                };
                newUser.UsuarioRol.Add(usuarioRol);

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