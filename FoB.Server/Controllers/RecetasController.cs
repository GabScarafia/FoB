using FoB.Application.Dtos;
using FoB.Application.Entities;
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

    [HttpPost]
    public async Task<IActionResult> CreateReceta([FromBody] RecetaRequest? recetaRequest)
    {
        return Ok(await _recetaRepository.CreateAsync(recetaRequest));
    }
}
