using FoB.Infrastructure.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Interface
{
    /// <summary>
    /// Define las operaciones de acceso a datos para la entidad ParticipacionDesafio.
    /// </summary>
    public interface IDesafioParticipacionRepository
    {
        /// <summary>
        /// Obtiene todas las participaciones de un desafío específico.
        /// Necesario para el recálculo y la generación del ranking.
        /// </summary>
        Task<IEnumerable<ParticipacionDesafio>> GetByDesafioIdAsync(int desafioId);

        /// <summary>
        /// Agrega una nueva participación.
        /// Usado por RecetaRepository.
        /// </summary>
        Task AddAsync(ParticipacionDesafio participacion);

        /// <summary>
        /// Actualiza una participación existente (principalmente la propiedad Puntos).
        /// Usado por DesafioService en la tarea de recálculo.
        /// </summary>
        Task UpdateAsync(ParticipacionDesafio participacion);

    }
}