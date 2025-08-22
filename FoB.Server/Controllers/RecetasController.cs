using FoB.Application.Dtos;
using FoB.Application.Entities.Receta;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoB.Server.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class RecetasController : ControllerBase
{
    private readonly IRecetaRepository _recetaRepository;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<RecetasController> _logger;

    public RecetasController(ILogger<RecetasController> logger, IRecetaRepository recetaRepository, ICurrentUser currentUser)
    {
        _logger = logger;
        _recetaRepository = recetaRepository;
        _currentUser = currentUser;
    }

    [HttpGet("Feed")]
    public async Task<IActionResult> Feed([FromQuery] int pageSize = 1)
    {
        // Verifica si el usuario sigue a alguien.
        bool estaSiguiendo = await _recetaRepository.EstaSiguiendoAlguienAsync();

        if (!estaSiguiendo)
        {
            // Caso 1: El usuario no sigue a nadie.
            // Devuelve un mensaje invitándolo a seguir a otras personas.
            return Ok(new { Mensaje = "No sigues a nadie. Sigue a gente para ver sus publicaciones!", Recetas = new List<RecetaResponse>() });
        }

        // Si el usuario sigue a alguien, intenta obtener las publicaciones.
        var recetas = await _recetaRepository.FeedAsync(pageSize);

        if (recetas == null || !recetas.Any())
        {
            // Caso 2: El usuario sigue a alguien, pero no hay publicaciones disponibles.
            return Ok(new { Mensaje = "No hay publicaciones de las personas que sigues.", Recetas = new List<RecetaResponse>() });
        }

        // Caso 3: Hay publicaciones.
        // Devuelve las recetas y un mensaje de éxito.
        return Ok(new { Mensaje = "Recetas cargadas con éxito.", Recetas = recetas });
    }

    [HttpGet("Tendencias")]
    public async Task<IActionResult> Tendencias([FromQuery] int pageSize = 1)
    {
        return Ok(await _recetaRepository.TendenciasAsync(pageSize));
    }

    [HttpPost]
    public async Task<IActionResult> CreateReceta([FromBody] RecetaRequest? recetaRequest)
    {
        return Ok(await _recetaRepository.CreateAsync(recetaRequest));
    }
}