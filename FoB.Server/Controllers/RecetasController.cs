using FoB.Application.Dtos;
using FoB.Application.Entities.Receta;
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

    private readonly ILogger<RecetasController> _logger;

    public RecetasController(ILogger<RecetasController> logger, IRecetaRepository recetaRepository)
    {
        _logger = logger;
        _recetaRepository = recetaRepository;
    }

    [HttpGet("Feed")]
    public async Task<IActionResult> Feed([FromQuery] int pageSize = 1)
    {
        return Ok(await _recetaRepository.FeedAsync(pageSize));
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
