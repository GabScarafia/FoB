using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using FoB.Application.Interfaces;
using FoB.Application.Dtos;
using System.Linq;
using System;

namespace FoB.Server.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class DesafiosController : ControllerBase
    {
        private readonly IDesafioService _desafioService;

        // Inyección de la capa de servicio (ahora funciona gracias a la interfaz)
        public DesafiosController(IDesafioService desafioService)
        {
            _desafioService = desafioService;
        }

        /// <summary>
        /// Obtiene el desafío activo actual y el ranking (Top 3) de la semana pasada.
        /// Satisface: Pop-up inicial, Notificaciones al abrir la app (Gabinota).
        /// Endpoint: GET /Desafios/Actual
        /// </summary>
        [HttpGet("Actual")]
        public async Task<ActionResult<DesafioSemanalDto>> GetDesafioActual()
        {
            var desafioData = await _desafioService.GetDesafioActivoYRankingAnteriorAsync();

            if (desafioData?.DesafioActual == null && !desafioData.RankingAnterior.Any())
            {
                // Si no hay desafío activo NI ranking anterior, se devuelve 404 (o 204 No Content, pero 404 es más descriptivo en este contexto)
                return NotFound("No se encontró ningún desafío activo ni datos relevantes.");
            }

            // Retorna el DTO que contiene: Desafío de la semana + Top 3 anterior.
            return Ok(desafioData);
        }

        /// <summary>
        /// Obtiene la lista completa del ranking de puntos actual para el desafío en curso.
        /// Satisface: Requerimiento de "mostrar el ranking semanal" completo.
        /// Endpoint: GET /Desafios/Ranking
        /// </summary>
        [HttpGet("Ranking")]
        public async Task<ActionResult<IEnumerable<RankingDto>>> GetRankingSemanal()
        {
            var ranking = await _desafioService.GetCurrentWeeklyRankingAsync();

            if (ranking == null || !ranking.Any())
            {
                return NotFound("Aún no hay participantes en el ranking de esta semana o el desafío no ha comenzado.");
            }

            return Ok(ranking);
        }

        // =========================================================================
        // ENDPOINTS DE GESTIÓN (ADMIN)
        // =========================================================================

        /// <summary>
        /// Crea un nuevo desafío. Solo para uso administrativo.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<DesafioManagementResponseDto>> CreateDesafio([FromBody] CrearDesafioRequestDto request)
        {
            try
            {
                var response = await _desafioService.CreateDesafioAsync(request);
                return CreatedAtAction(nameof(GetDesafioActual), new { id = response.DesafioId }, response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                // Manejo de errores generales de persistencia
                return StatusCode(500, $"Error interno del servidor al crear el desafío: {ex.Message}");
            }
        }

        /// <summary>
        /// Actualiza un desafío existente. Solo para uso administrativo.
        /// </summary>
        [HttpPut]
        public async Task<ActionResult<DesafioManagementResponseDto>> UpdateDesafio([FromBody] ActualizarDesafioRequestDto request)
        {
            try
            {
                var response = await _desafioService.UpdateDesafioAsync(request);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor al actualizar el desafío: {ex.Message}");
            }
        }
    }
}
