using FoB.Application.Dtos;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Models;
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

        public UsuarioController(fobContext context)
        {
            _context = context;
        }

        [HttpGet("perfil")]
        [Authorize]
        public async Task<ActionResult<UsuarioPerfilDto>> GetPerfilDelUsuarioActual()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int idUsuario))
            {
                return Unauthorized(new { message = "ID de usuario no encontrado en el token o formato inválido." });
            }

            return await GetPerfilCompleto(idUsuario);
        }

        [HttpGet("{idUsuario}")]
        public async Task<ActionResult<UsuarioPerfilDto>> GetPerfilCompleto(int idUsuario)
        {
            int? idUsuarioActual = null;
            if (User.Identity.IsAuthenticated)
            {
                var idClaim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
                if (int.TryParse(idClaim, out int actualId))
                {
                    idUsuarioActual = actualId;
                }
            }

            try
            {
                var usuario = await _context.Usuario
                    .Where(u => u.Id == idUsuario)
                    .Include(u => u.UsuarioImagen)
                    .Include(u => u.Receta.Where(r => r.Activa == true))
                        .ThenInclude(r => r.RecetaImagen)
                    .Include(u => u.SeguimientoUsuarioSeguidor)
                    .Include(u => u.SeguimientoUsuarioSeguido)
                    .FirstOrDefaultAsync();

                if (usuario == null)
                {
                    return NotFound();
                }

                var fotoPerfilBytes = usuario.UsuarioImagen.FirstOrDefault()?.Imagen;
                string fotoPerfilBase64 = null;
                if (fotoPerfilBytes != null && fotoPerfilBytes.Length > 0)
                {
                    fotoPerfilBase64 = Convert.ToBase64String(fotoPerfilBytes);
                }

                var publicacionesDto = usuario.Receta.Select(r => new RecetaDto
                {
                    Id = r.Id,
                    Titulo = r.Titulo,
                    ImagenPrincipalBase64 = r.RecetaImagen.FirstOrDefault(x => x.PasoId == null) != null
                        ? Convert.ToBase64String(r.RecetaImagen.FirstOrDefault(x => x.PasoId == null).Imagen)
                        : null
                })
                .OrderByDescending(x => x.Id)
                .ToList();

                bool esSeguido = false;
                if (idUsuarioActual.HasValue && idUsuarioActual.Value != idUsuario)
                {
                    esSeguido = usuario.SeguimientoUsuarioSeguido
                        .Any(s => s.SeguidorId == idUsuarioActual.Value);
                }

                var perfilDto = new UsuarioPerfilDto
                {
                    Id = usuario.Id,
                    Nombre = usuario.Nombre,
                    Apellido = usuario.Apellido,
                    NombreUsuario = usuario.NombreUsuario,
                    Email = usuario.Email,
                    Biografia = usuario.Biografia,
                    FotoPerfilBase64 = fotoPerfilBase64,
                    CantidadPublicaciones = usuario.Receta.Count(),
                    CantidadSeguidores = usuario.SeguimientoUsuarioSeguido.Count(),
                    CantidadSeguidos = usuario.SeguimientoUsuarioSeguidor.Count(),
                    Publicaciones = publicacionesDto,
                    EsSeguido = esSeguido
                };

                return Ok(perfilDto);
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