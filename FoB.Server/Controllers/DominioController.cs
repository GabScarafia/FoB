using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoB.Server.Controllers;


[ApiController]
[Route("[controller]")]
[Authorize]

public class DominioController : ControllerBase
{
    private readonly ILogger<DominioController> _logger;
    private readonly DominioService _etiquetasService;
    public DominioController(ILogger<DominioController> logger, DominioService etiquetasService)
    {
        _logger = logger;
        _etiquetasService = etiquetasService;
    }

    [HttpGet("Etiquetas")]
    public async Task<IActionResult> Etiquestas([FromQuery] string texto)
    {
       var etiquetas = await _etiquetasService.GetEtiquestas(texto);
       return Ok(etiquetas);

    }

    [HttpGet("Ingredientes")]
    public async Task<IActionResult> Ingredientes([FromQuery] string texto)
    {
        var etiquetas = await _etiquetasService.GetIngredientes(texto);
        return Ok(etiquetas);

    }

    [HttpGet("Unidades")]
    public async Task<IActionResult> Unidades([FromQuery] string texto)
    {
        var etiquetas = await _etiquetasService.GetUnidades(texto);
        return Ok(etiquetas);

    }

    [HttpGet("Utensilios")]
    public async Task<IActionResult> Utensilio([FromQuery] string texto)
    {
        var etiquetas = await _etiquetasService.GetUtensilio(texto);
        return Ok(etiquetas);

    }
}
