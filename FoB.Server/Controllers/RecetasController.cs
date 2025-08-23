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
        // 1. Obtener las publicaciones de las personas que el usuario sigue.
        var recetas = await _recetaRepository.FeedAsync(pageSize);

        // 2. Si no se encuentran recetas, se verifica la razón.
        if (recetas == null || !recetas.Any())
        {
            // Se usa el repositorio para verificar si el usuario sigue a alguien.
            bool estaSiguiendo = await _recetaRepository.EstaSiguiendoAlguienAsync();

            if (estaSiguiendo)
            {
                // Caso 1: El usuario sigue a alguien, pero esas personas no tienen publicaciones.
                return Ok(new { Mensaje = "No hay publicaciones de las personas que sigues.", Recetas = new List<RecetaResponse>() });
            }
            else
            {
                // Caso 2: El usuario no sigue a nadie en absoluto.
                return Ok(new { Mensaje = "No sigues a nadie. Sigue a gente para ver sus publicaciones!", Recetas = new List<RecetaResponse>() });
            }
        }

        // 3. Si se encontraron recetas, se devuelven.
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