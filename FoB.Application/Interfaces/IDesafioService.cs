using FoB.Application.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FoB.Application.Interfaces
{
    /// <summary>
    /// Define las operaciones de negocio para la gestión de desafíos y rankings.
    /// </summary>
    public interface IDesafioService
    {

        /// <summary>
        /// Obtiene el desafío activo actual y el Top 3 del ranking anterior (para el pop-up).
        /// </summary>
        Task<DesafioSemanalDto> GetDesafioActivoYRankingAnteriorAsync();

        /// <summary>
        /// Obtiene la lista completa del ranking de puntos del desafío actual.
        /// </summary>
        Task<IEnumerable<RankingDto>> GetCurrentWeeklyRankingAsync();


        /// <summary>
        /// Crea un nuevo desafío. Usado por el administrador.
        /// </summary>
        Task<DesafioManagementResponseDto> CreateDesafioAsync(CrearDesafioRequestDto request);

        /// <summary>
        /// Actualiza un desafío existente. Usado por el administrador.
        /// </summary>
        Task<DesafioManagementResponseDto> UpdateDesafioAsync(ActualizarDesafioRequestDto request);

        /// <summary>
        /// Proceso de fondo que se ejecuta al final de la semana para cerrar el desafío, calcular el ranking final y preparar el siguiente.
        /// </summary>
        Task FinalizarDesafioYCalcularRankingAsync();

    }
}