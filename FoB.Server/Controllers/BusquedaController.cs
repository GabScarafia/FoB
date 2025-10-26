using FoB.Application.Dtos;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;

namespace FoB.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class BusquedaController : ControllerBase
    {
        private readonly IBusquedaRepository _busquedaRepository;

        public BusquedaController(IBusquedaRepository busquedaRepository)
        {
            _busquedaRepository = busquedaRepository;
        }

        [HttpGet("usuarios")]
        public async Task<ActionResult<List<UsuarioBusquedaDto>>> BuscarUsuarios([FromQuery] string termino)
        {
            if (string.IsNullOrWhiteSpace(termino))
            {
                return BadRequest("El término de búsqueda no puede estar vacío.");
            }

            var usuarios = await _busquedaRepository.BuscarUsuariosAsync(termino);

            if (usuarios == null || usuarios.Count == 0)
            {
                return NotFound("No se encontraron usuarios.");
            }

            return Ok(usuarios);
        }

        [HttpGet]
        public async Task<IActionResult> Buscar([FromQuery] string termino)
        {
            if (string.IsNullOrWhiteSpace(termino))
            {
                return BadRequest("El término de búsqueda no puede estar vacío.");
            }

            var usuarios = await _busquedaRepository.BuscarUsuariosAsync(termino);

            var recetas = await _busquedaRepository.BuscarRecetasAsync(termino);

            BusquedaResponse response = new BusquedaResponse()
            {
                Usuarios = usuarios,
                Recetas=recetas
            };
            return Ok(response);
        }

        public class BusquedaResponse
        {
            public List<UsuarioBusquedaDto> Usuarios { get; set; }
            public List<RecetaBusquedaDto> Recetas { get; set; }
        }
    }
}