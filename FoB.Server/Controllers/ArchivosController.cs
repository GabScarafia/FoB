using FoB.Infrastructure.Context; // Asumo que aquí está tu fobContext
using FoB.Infrastructure.Models; // Asumo que aquí están RecetaImagen y UsuarioImagen
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

[ApiController]
[Route("api/archivos")]
public class ArchivosController : ControllerBase
{
    private readonly fobContext _context;

    public ArchivosController(fobContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Devuelve una imagen o video de una Receta (portada o paso).
    /// </summary>
    [HttpGet("receta/{id}")]
    public async Task<IActionResult> GetRecetaArchivo(int id)
    {
        // 1. Buscamos la entidad RecetaImagen por su ID
        // Usamos AsNoTracking para que sea más rápido, es solo lectura.
        var archivo = await _context.Set<RecetaImagen>()
                                    .AsNoTracking()
                                    .FirstOrDefaultAsync(img => img.Id == id);

        if (archivo == null || archivo.Imagen == null)
        {
            return NotFound();
        }

        // 2. ¡LA MAGIA!
        // Esto devuelve el archivo con el ContentType correcto (ej: "video/mp4" o "image/jpeg").
        // El navegador sabe qué hacer (mostrar la imagen o reproducir el video).
        return File(archivo.Imagen, archivo.ContentType);
    }

    /// <summary>
    /// Devuelve la imagen de perfil de un Usuario.
    /// </summary>
    [HttpGet("usuario/{id}")]
    public async Task<IActionResult> GetUsuarioImagen(int id)
    {
        // 1. Buscamos la entidad UsuarioImagen por su ID
        var archivo = await _context.Set<UsuarioImagen>()
                                    .AsNoTracking()
                                    .FirstOrDefaultAsync(img => img.Id == id);

        if (archivo == null || archivo.Imagen == null)
        {
            // Opcional: devolver una imagen por defecto si no se encuentra
            // return File("ruta/a/avatar.png", "image/png");
            return NotFound();
        }

        // 2. Asumo que UsuarioImagen también tiene una propiedad ContentType.
        // Si no la tiene, DEBES agregarla a tu modelo.
        // Como fallback, puedes hardcodear "image/jpeg", pero no es ideal.
        string contentType = "image/jpeg"; 

        return File(archivo.Imagen, contentType);
    }
}