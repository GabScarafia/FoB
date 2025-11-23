using FoB.Application.Dtos;
using FoB.Application.Entities.Receta;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace FoB.Server.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class RecetasController : ControllerBase
{
    private readonly IRecetaRepository _recetaRepository;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<RecetasController> _logger;
    private readonly fobContext _context;

    public RecetasController(
        ILogger<RecetasController> logger,
        IRecetaRepository recetaRepository,
        ICurrentUser currentUser,
        fobContext context)
    {
        _logger = logger;
        _recetaRepository = recetaRepository;
        _currentUser = currentUser;
        _context = context;
    }

    [HttpGet("Feed")]
    public async Task<IActionResult> Feed([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 5, [FromQuery] string? termino = null)
    {
        var recetas = await _recetaRepository.FeedAsync(pageNumber, pageSize, termino);

        if (recetas == null || !recetas.Any())
        {
            if (pageNumber > 1)
            {
                return Ok(new { Mensaje = "No hay más publicaciones.", Recetas = new List<RecetaResponse>() });
            }

            bool estaSiguiendo = await _recetaRepository.EstaSiguiendoAlguienAsync();

            if (estaSiguiendo)
            {
                return Ok(new { Mensaje = "No hay publicaciones de las personas que sigues.", Recetas = new List<RecetaResponse>() });
            }
            else
            {
                return Ok(new { Mensaje = "No sigues a nadie. Sigue a gente para ver sus publicaciones!", Recetas = new List<RecetaResponse>() });
            }
        }
        return Ok(new { Mensaje = "Recetas cargadas con éxito.", Recetas = recetas });
    }

    [HttpGet("Tendencias")]
    public async Task<IActionResult> Tendencias([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 15)
    {
        var recetas = await _recetaRepository.TendenciasAsync(pageNumber, pageSize);

        if (recetas == null || !recetas.Any())
        {
            if (pageNumber > 1)
            {
                return Ok(new { Mensaje = "No hay más tendencias.", Recetas = new List<RecetaResponse>() });
            }
            return Ok(new { Mensaje = "No hay tendencias para mostrar.", Recetas = new List<RecetaResponse>() });
        }

        return Ok(new { Mensaje = "Tendencias cargadas.", Recetas = recetas });
    }

    [HttpPost]
    public async Task<IActionResult> CreateReceta([FromBody] RecetaRequest? recetaRequest)
    {
        if (recetaRequest == null) return BadRequest("Datos inválidos.");
        return Ok(await _recetaRepository.CreateAsync(recetaRequest));
    }

    // ---------------------------------------------------------
    // MÉTODO PARA EDICIÓN
    // ---------------------------------------------------------
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateReceta([FromRoute] int id, [FromBody] RecetaUpdateRequest recetaRequest)
    {

        
        if (recetaRequest == null)
        {
            _logger.LogWarning("UpdateReceta: El cuerpo de la solicitud llegó nulo.");
            return BadRequest("Datos de receta inválidos o vacíos.");
        }

        _logger.LogInformation("UpdateReceta llamado para ID: {Id}", id);

        try 
        {
            var updated = await _recetaRepository.UpdateAsync(id, recetaRequest);
            
            if (!updated)
            {
                return NotFound(new { message = "Receta no encontrada o no tienes permisos para editarla." });
            }

            return Ok(new { message = "Receta actualizada correctamente." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar la receta {Id}", id);
            return StatusCode(500, new { message = "Error interno al actualizar la receta." });
        }
    }

    [HttpPost("LikeOrDislike/{idReceta}")]
    public async Task<IActionResult> LikeOrDislike([FromRoute] int idReceta)
    {
        return Ok(await _recetaRepository.LikeOrDislike(idReceta));
    }

    [HttpPost("Interaccion")]
    public async Task<IActionResult> Interaccion([FromBody] InteraccionDto interaccion)
    {
        return Ok(await _recetaRepository.Interaccion(interaccion));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
    public async Task<IActionResult> DeleteReceta(int id)
    {
        var result = await _recetaRepository.DeleteAsync(id);

        if (!result)
        {
            return NotFound(new { message = "Receta no encontrada o no tienes permiso para eliminarla." });
        }
        return NoContent();
    }

    [HttpGet("Get")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RecetaResponse>>> GetRecetas([FromQuery] int? userId)
    {
        var idUsuario = userId ?? _currentUser.User?.Id;

        if (idUsuario == null)
        {
            _logger.LogWarning("Intento de acceder a recetas sin usuario autenticado");
            return Unauthorized(new { Mensaje = "Usuario no autenticado." });
        }

        try
        {
            var recetasDb = await _context.Receta
                .Where(r => r.Activa == true && r.UsuarioId == idUsuario)
                .Include(r => r.Usuario)
                .Include(r => r.RecetaImagen)
                .Include(r => r.IngredienteReceta).ThenInclude(ir => ir.Ingrediente)
                .Include(r => r.IngredienteReceta).ThenInclude(ir => ir.Unidad)
                .Include(r => r.Paso)
                .Include(r => r.RecetaEtiquetas).ThenInclude(rc => rc.Etiquetas)
                .Include(r => r.RecetaUtensilio).ThenInclude(rc => rc.Utensilio)
                .Include(r => r.Voto)
                .Include(r => r.Comentario).ThenInclude(c => c.Usuario)
                .ToListAsync();

            if (!recetasDb.Any())
            {
                return Ok(new { Mensaje = "Aún no hay recetas.", Recetas = new List<RecetaResponse>() });
            }

            var recetasResponse = recetasDb
                .OrderByDescending(r => r.FechaCreacion)
                .Select(receta => new RecetaResponse
                {
                    Id = receta.Id,
                    Titulo = receta.Titulo,
                    Descripcion = receta.Descripcion,
                    Dificultad = receta.Dificultad,
                    TiempoPreparacion = receta.TiempoPreparacion != null
                        ? new TimeSpan(receta.TiempoPreparacion.Value.Hour,
                                       receta.TiempoPreparacion.Value.Minute,
                                       receta.TiempoPreparacion.Value.Second)
                        : (TimeSpan?)null,
                    FechaCreacion = receta.FechaCreacion,
                    ImagenUrl = receta.RecetaImagen.FirstOrDefault(img => img.PasoId == null) != null ? $"/api/archivos/receta/{receta.RecetaImagen.FirstOrDefault(img => img.PasoId == null).Id}" : null,
                    Autor = receta.Usuario != null ? new UsuarioResponse
                    {
                        Id = receta.Usuario.Id,
                        Nombre = receta.Usuario.Nombre,
                        NombreUsuario = receta.Usuario.NombreUsuario
                    } : null,
                    Ingredientes = receta.IngredienteReceta?
                        .Select(ir => new IngredienteResponse
                        {
                            Id = ir.Ingrediente.Id,
                            Nombre = ir.Ingrediente.Nombre,
                            Cantidad = ir.Cantidad,
                            UnidadDeMedida = ir.Unidad.Nombre,
                            UnidadId = ir.Unidad.Id
                        }).ToList() ?? new List<IngredienteResponse>(),
                    Pasos = receta.Paso?
                        .Select(p => new PasoResponse
                        {
                            Numero = p.Numero,
                            Titulo = p.Titulo,
                            Descripcion = p.Descripcion
                        }).ToList() ?? new List<PasoResponse>(),
                    Etiquetas = receta.RecetaEtiquetas?
                        .Select(rc => rc.Etiquetas.Nombre).ToList() ?? new List<string>(),
                    Utensilios = receta.RecetaUtensilio?
                        .Select(rc => rc.Utensilio.Nombre).ToList() ?? new List<string>(),
                    CantidadVotos = (int)receta.Voto.Where(v => v.Tipo == InteraccionTipoEnum.Like.ToString() && v.ComentarioId == null).Sum(x => x.Valor),
                    MeGusta = receta.Voto.Any(v => v.UsuarioId == idUsuario),
                    CantidadComentarios = receta.Comentario.Count,
                    VistaPreviaComentarios = receta.Comentario?
                        .Where(c => c.Usuario != null)
                        .OrderByDescending(c => c.Fecha)
                        .Take(3)
                        .Select(c => new ComentarioResponse
                        {
                            Id = c.Id,
                            Texto = c.Texto,
                            Usuario = new UsuarioResponse { NombreUsuario = c.Usuario.NombreUsuario },
                            Fecha = c.Fecha
                        }).ToList() ?? new List<ComentarioResponse>()
                }).ToList();

            return Ok(new { Mensaje = "Recetas cargadas con éxito.", Recetas = recetasResponse });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al cargar recetas del usuario {UserId}", idUsuario);
            return StatusCode(500, new { Mensaje = "Error interno al cargar recetas.", Recetas = new List<RecetaResponse>() });
        }
    }

    [HttpGet("{id}")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
    public async Task<IActionResult> GetRecetaById([FromRoute] int id)
    {
        var result = await _recetaRepository.GetById(id);
        if (result == null)
            return BadRequest("La receta no fue encontrada");

        return Ok(result);
    }
}