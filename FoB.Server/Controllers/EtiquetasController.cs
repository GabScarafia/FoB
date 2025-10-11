using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoB.Server.Controllers;


[ApiController]
[Route("[controller]")]
//[Authorize]

public class EtiquetasController : ControllerBase
{
    private readonly ILogger<EtiquetasController> _logger;
    private readonly IEtiquetasService _etiquetasService;
    public EtiquetasController(ILogger<EtiquetasController> logger, IEtiquetasService etiquetasService)
    {
        _logger = logger;
        _etiquetasService = etiquetasService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string texto)
    {
       var etiquetas = await _etiquetasService.GetEtiquestas(texto);
       return Ok(etiquetas);

    }
}
