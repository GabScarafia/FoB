using FoB.Application.Dtos;
using FoB.Application.Entities;
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
        var comentarios = await _repository.GetByRecetaAsync(idReceta);

        // mapear a DTO
        var comentariosDTO = comentarios.Select(c => new ComentarioDTO
        {
            Id = c.Id,
            IdReceta = c.IdReceta,
            Texto = c.Texto,
            FechaCreacion = c.FechaCreacion,
            RespuestaAComentarioId = c.RespuestaAComentarioId,
            Usuario = c.Usuario,
            Respuestas = new List<ComentarioDTO>()
        }).ToList();

        // armar jerarquía de respuestas
        var comentariosPadre = comentariosDTO
            .Where(c => c.RespuestaAComentarioId == null)
            .ToList();

        foreach (var padre in comentariosPadre)
        {
            padre.Respuestas = comentariosDTO
                .Where(r => r.RespuestaAComentarioId == padre.Id)
                .ToList();
        }

        return Ok(comentariosPadre);
    }

    // Reemplaza el método Crear para asegurar que todas las rutas devuelven un valor.
    [HttpPost]
    public async Task<ActionResult<ComentarioDTO>> Crear([FromBody] ComentarioCreateDTO dto)
    {
        var comentario = new ComentarioRequest
        {
            RecetaId = dto.IdReceta,
            Texto = dto.Texto,
            RespuestaAComentarioId = dto.IdComentario,
            Fecha = DateTime.Now
        };

        var creado = await _repository.AddAsync(comentario);

        if (creado == null)
        {
            return BadRequest("No se pudo crear el comentario.");
        }

        var comentarioDTO = new ComentarioDTO
        {
            Id = creado.Id,
            IdReceta = creado.RecetaId,
            Texto = creado.Texto,
            FechaCreacion = creado.Fecha ?? DateTime.Now,
            RespuestaAComentarioId = creado.RespuestaAComentarioId,
            Usuario = new UsuarioComentarioDTO
            {
                Nombre = "Test",       // reemplazar por usuario real
                Apellido = "",
                NombreUsuario = "JhonnyTest",
                FotoUrl = ""
            },
            Respuestas = new List<ComentarioDTO>()
        };

        return Ok(comentarioDTO);
    }
}
