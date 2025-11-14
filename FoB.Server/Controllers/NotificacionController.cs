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
 [Authorize]
 public class NotificacionController : ControllerBase
 {
 private readonly fobContext _context;

 public NotificacionController(fobContext context)
 {
 _context = context;
 }

 private int? GetCurrentUserId()
 {
 var userIdClaim = User.FindFirstValue("id");
 if (int.TryParse(userIdClaim, out var userId)) return userId;
 return null;
 }

 [HttpGet]
 public async Task<IActionResult> GetAll()
 {
 var userId = GetCurrentUserId();
 if (!userId.HasValue) return Unauthorized();

 var notifications = await _context.Notificacion
 .Where(n => n.UsuarioId == userId.Value)
 .OrderByDescending(n => n.FechaDeEnvio)
 .Select(n => new
 {
 id = n.Id,
 fecha = n.FechaDeEnvio,
 leida = n.Leida,
 mensaje = n.Mensaje,
 tipo = n.Tipo,
 url = n.UrlEnlace,
 emisor = n.Emisor != null ? new { id = n.Emisor.Id, nombreUsuario = n.Emisor.NombreUsuario, nombre = n.Emisor.Nombre, imagenUrl = n.Emisor.UsuarioImagen.OrderByDescending(i => i.Id).FirstOrDefault() != null ? $"/api/archivos/usuario/{n.Emisor.UsuarioImagen.OrderByDescending(i => i.Id).FirstOrDefault().Id}" : null } : null
 }).ToListAsync();

 return Ok(notifications);
 }

 [HttpGet("unread-count")]
 public async Task<IActionResult> GetUnreadCount()
 {
 var userId = GetCurrentUserId();
 if (!userId.HasValue) return Unauthorized();

 var count = await _context.Notificacion
 .Where(n => n.UsuarioId == userId.Value && (n.Leida == null || n.Leida == false))
 .CountAsync();

 return Ok(new { count });
 }

 [HttpPost("mark-read/{id}")]
 public async Task<IActionResult> MarkRead(int id)
 {
 var userId = GetCurrentUserId();
 if (!userId.HasValue) return Unauthorized();

 var n = await _context.Notificacion.FirstOrDefaultAsync(x => x.Id == id && x.UsuarioId == userId.Value);
 if (n == null) return NotFound();

 n.Leida = true;
 await _context.SaveChangesAsync();
 return Ok();
 }

 [HttpPost("mark-read-all")]
 public async Task<IActionResult> MarkReadAll()
 {
 var userId = GetCurrentUserId();
 if (!userId.HasValue) return Unauthorized();

 var list = await _context.Notificacion.Where(x => x.UsuarioId == userId.Value && (x.Leida == null || x.Leida == false)).ToListAsync();
 foreach (var n in list) n.Leida = true;
 await _context.SaveChangesAsync();
 return Ok();
 }

 [HttpDelete("{id}")]
 public async Task<IActionResult> Delete(int id)
 {
 var userId = GetCurrentUserId();
 if (!userId.HasValue) return Unauthorized();

 var n = await _context.Notificacion.FirstOrDefaultAsync(x => x.Id == id && x.UsuarioId == userId.Value);
 if (n == null) return NotFound();
 _context.Notificacion.Remove(n);
 await _context.SaveChangesAsync();
 return Ok();
 }

 [HttpDelete("all")]
 public async Task<IActionResult> DeleteAll()
 {
 var userId = GetCurrentUserId();
 if (!userId.HasValue) return Unauthorized();

 var list = await _context.Notificacion.Where(x => x.UsuarioId == userId.Value).ToListAsync();
 _context.Notificacion.RemoveRange(list);
 await _context.SaveChangesAsync();
 return Ok();
 }
 }
}
