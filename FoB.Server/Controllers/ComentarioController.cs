// src/FoB.Server/Controllers/ComentarioController.cs

using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoB.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Asegúrate de que los usuarios estén autenticados para interactuar con comentarios
public class ComentarioController : ControllerBase
{
    private readonly IComentarioRepository _repository;
    private readonly ICurrentUser _currentUser; // ¡NUEVO! Inyectamos ICurrentUser

    // Modificamos el constructor para inyectar ICurrentUser
    public ComentarioController(IComentarioRepository repository, ICurrentUser currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    // GET api/comentario/receta/{idReceta}
    [HttpGet("receta/{idReceta}")]
    public async Task<ActionResult<IEnumerable<ComentarioDTO>>> GetByReceta(int idReceta)
    {
        var comentarios = await _repository.GetByRecetaAsync(idReceta);
        return Ok(comentarios);
    }

    [HttpPost]
    public async Task<ActionResult<ComentarioDTO>> Crear([FromBody] ComentarioCreateDTO dto)
    {
        var creado = await _repository.AddAsync(dto);

        if (creado == null)
        {
            return BadRequest("No se pudo crear el comentario.");
        }

        return Ok(creado);
    }

    // --- ¡NUEVO ENDPOINT: DELETE para eliminar lógicamente un comentario! ---
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        // 1. Obtener el comentario para verificar su existencia y autoría
        var comentarioToDelete = await _repository.GetByIdAsync(id);
        if (comentarioToDelete == null)
        {
            return NotFound($"Comentario con ID {id} no encontrado.");
        }

        // 2. Obtener el ID del usuario actual
        // Asumiendo que _currentUser.User.Id contiene el ID del usuario autenticado
        int currentUserId = _currentUser.User.Id;

        // 3. ¡Verificación de autoría!
        if (comentarioToDelete.Usuario.Id != currentUserId)
        {
            // Si el usuario actual no es el autor del comentario, se prohíbe la acción.
            return Forbid("No tienes permiso para eliminar este comentario.");
        }

        // 4. Si la verificación es exitosa, se procede con el borrado lógico
        await _repository.DeleteAsync(id);

        // 5. Devolver una respuesta exitosa sin contenido (204 No Content)
        return NoContent();
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ComentarioDTO>> Update(int id, [FromBody] ComentarioUpdateDTO dto)
    {
        var comentario = await _repository.GetByIdAsync(id);
        if (comentario == null)
            return NotFound($"Comentario con ID {id} no encontrado.");

        int currentUserId = _currentUser.User.Id;

        if (comentario.Usuario.Id != currentUserId)
            return Forbid("No tenés permiso para modificar este comentario.");

        try
        {
            var actualizado = await _repository.UpdateAsync(id, dto);
            return Ok(actualizado);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
}