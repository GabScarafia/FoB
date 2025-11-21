using FoB.Application.Dtos;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Models;
using FoB.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FoB.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UsuarioController : ControllerBase
    {
        private readonly fobContext _context;
        private readonly IUsuarioPerfilService _usuarioPerfilService;

        public UsuarioController(fobContext context, IUsuarioPerfilService usuarioPerfilService)
        {
            _context = context;
            _usuarioPerfilService = usuarioPerfilService;
        }

        [HttpGet("perfil")]
        [Authorize]
        public async Task<ActionResult<UsuarioPerfilDto>> GetPerfilDelUsuarioActual()
        {
            // Extrae el ID del usuario de los claims del token JWT
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int idUsuario))
            {
                // Si el claim 'id' no existe o no es un número, es una solicitud no válida
                return Unauthorized(new { message = "ID de usuario no encontrado en el token o formato inválido." });
            }

            // Obtener id del usuario actual para la lógica de seguimiento
            int? idUsuarioActual = idUsuario;
            var perfil = await _usuarioPerfilService.ObtenerPerfilUsuarioAsync(idUsuario, idUsuarioActual);
            if (perfil == null) return NotFound();
            return Ok(perfil);
        }

        [HttpGet("{idUsuario}")]
        public async Task<ActionResult<UsuarioPerfilDto>> GetPerfilCompleto(int idUsuario)
        {
            try
            {
                // Obtener el ID del usuario actual desde el token
                int? idUsuarioActual = null;
                if (User.Identity.IsAuthenticated)
                {
                    var idClaim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
                    if (int.TryParse(idClaim, out int actualId))
                    {
                        idUsuarioActual = actualId;
                    }
                }

                // Use the optimized service projection to load the profile
                var perfil = await _usuarioPerfilService.ObtenerPerfilUsuarioAsync(idUsuario, idUsuarioActual);
                if (perfil == null)
                    return NotFound();

                return Ok(perfil);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.ToString());
                return StatusCode(500, new { message = "Error interno del servidor al cargar el perfil." });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<UsuarioPerfilDto>> PutUsuario(int id, UsuarioUpdateDto dto)
        {
            // 1. Autorización: Verificar que el ID de la ruta coincide con el ID del token JWT
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int tokenUserId) || tokenUserId != id)
            {
                // Si intenta editar otro usuario, denegar acceso.
                return StatusCode(403, new { message = "No tienes permiso para editar este perfil." });
            }

            // 2. Buscar el usuario en la base de datos
            var usuario = await _context.Usuario
                .Include(u => u.UsuarioImagen)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (usuario == null)
            {
                return NotFound(new { message = $"Usuario con ID {id} no encontrado." });
            }

            // 3. Validar duplicidad de Nombre de Usuario
            if (await _context.Usuario.AnyAsync(u => u.NombreUsuario == dto.NombreUsuario && u.Id != id))
            {
                return Conflict(new { message = "El nombre de usuario ya está en uso." });
            }
            // 4. Validar duplicidad de Email
            if (await _context.Usuario.AnyAsync(u => u.Email == dto.Email && u.Id != id))
            {
                return Conflict(new { message = "El email ya está registrado por otra cuenta." });
            }

            // 5. Actualizar campos básicos
            usuario.Nombre = dto.Nombre;
            usuario.Apellido = dto.Apellido;
            usuario.NombreUsuario = dto.NombreUsuario;
            usuario.Biografia = dto.Biografia ?? string.Empty;
            usuario.Email = dto.Email;

            // 6. Manejar Contraseña (Solo si se proporciona una nueva)
            if (!string.IsNullOrEmpty(dto.Contrasena))
            {
                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena);
                usuario.Contrasena = hashedPassword;
            }

            // 7. Manejar la Imagen de Perfil (Solo si se envió un nuevo Base64)
            if (!string.IsNullOrEmpty(dto.FotoPerfilBase64))
            {
                var imagenBytes = Convert.FromBase64String(dto.FotoPerfilBase64);
                var usuarioImagen = usuario.UsuarioImagen.FirstOrDefault();

                if (usuarioImagen == null)
                {
                    // Crear nueva imagen
                    var nuevaImagen = new UsuarioImagen
                    {
                        UsuarioId = usuario.Id,
                        Imagen = imagenBytes
                    };
                    _context.UsuarioImagen.Add(nuevaImagen);
                }
                else
                {
                    // Actualizar imagen existente
                    usuarioImagen.Imagen = imagenBytes;
                    _context.UsuarioImagen.Update(usuarioImagen);
                }
            }

            // 8. Guardar cambios en la DB
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx)
            {
                Console.Error.WriteLine(dbEx.ToString());
                return StatusCode(500, new { message = "Error al guardar los cambios en la base de datos." });
            }

            // 9. Retornar el perfil actualizado llamando a tu método GET.
            return await GetPerfilCompleto(id);
        }
    }
}