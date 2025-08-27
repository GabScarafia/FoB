// src/FoB.Server/Controllers/ComentarioController.cs

using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoB.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ComentarioController : ControllerBase
{
    private readonly IComentarioRepository _repository;

    public ComentarioController(IComentarioRepository repository)
    {
        _repository = repository;
    }

    // GET api/comentario/receta/{idReceta}
    [HttpGet("receta/{idReceta}")]
    public async Task<ActionResult<IEnumerable<ComentarioDTO>>> GetByReceta(int idReceta)
    {
        // El repositorio ahora se encarga de anidar los comentarios.
        var comentarios = await _repository.GetByRecetaAsync(idReceta);
        return Ok(comentarios);
    }

    [HttpPost]
    public async Task<ActionResult<ComentarioDTO>> Crear([FromBody] ComentarioCreateDTO dto)
    {
        // Pasa directamente el DTO de creación al repositorio.
        var creado = await _repository.AddAsync(dto);

        if (creado == null)
        {
            return BadRequest("No se pudo crear el comentario.");
        }

        return Ok(creado);
    }
}