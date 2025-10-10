using Microsoft.AspNetCore.Mvc;
using FoB.Application.Dtos;
using System.Threading.Tasks;
using FoB.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

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
            // Extrae el ID del usuario de los claims del token JWT
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int idUsuario))
            {
                // Si el claim 'id' no existe o no es un número, es una solicitud no válida
                return Unauthorized(new { message = "ID de usuario no encontrado en el token o formato inválido." });
            }

            return await GetPerfilCompleto(idUsuario);
        }

        [HttpGet("{idUsuario}")]
        public async Task<ActionResult<UsuarioPerfilDto>> GetPerfilCompleto(int idUsuario)
        {
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

                // Obtiene y convierte la imagen de perfil a Base64
                var fotoPerfilBytes = usuario.UsuarioImagen.FirstOrDefault()?.Imagen;
                string fotoPerfilBase64 = null;
                if (fotoPerfilBytes != null && fotoPerfilBytes.Length > 0)
                {
                    fotoPerfilBase64 = Convert.ToBase64String(fotoPerfilBytes);
                }

                // Mapea la lista de recetas del usuario a los DTOs
                var publicacionesDto = usuario.Receta.Select(r => new RecetaDto
                {
                    Id = r.Id,
                    Titulo = r.Titulo,
                    // primera imagen es la principal para la galería
                    ImagenPrincipalBase64 = r.RecetaImagen.FirstOrDefault(x=>x.PasoId == null) != null
                        ? Convert.ToBase64String(r.RecetaImagen.FirstOrDefault(x => x.PasoId == null).Imagen)
                        : null
                })
                .OrderByDescending(x=>x.Id)
                .ToList();

                // Crea el DTO final con toda la información consolidada
                var perfilDto = new UsuarioPerfilDto
                {
                    Id = usuario.Id,
                    NombreUsuario = usuario.NombreUsuario,
                    NombreCompleto = $"{usuario.Nombre} {usuario.Apellido}",
                    Biografia = usuario.Biografia,
                    FotoPerfilBase64 = fotoPerfilBase64,
                    CantidadPublicaciones = usuario.Receta.Count(),
                    CantidadSeguidores = usuario.SeguimientoUsuarioSeguido.Count(),
                    CantidadSeguidos = usuario.SeguimientoUsuarioSeguidor.Count(),
                    Publicaciones = publicacionesDto
                };

                return Ok(perfilDto);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.ToString());
                return StatusCode(500, new { message = "Error interno del servidor al cargar el perfil." });
            }
        }
    }
}