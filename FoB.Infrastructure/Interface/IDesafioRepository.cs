using FoB.Infrastructure.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Interface
{
    public interface IDesafioRepository
    {
        // Crea un nuevo desafío en la base de datos.
        Task<Desafio> AddAsync(Desafio desafio);

        // Obtiene un desafío por su ID.
        Task<Desafio> GetByIdAsync(int id);

        // Obtiene el desafío actualmente activo (si existe).
        Task<Desafio> GetActiveDesafioAsync();

        // Actualiza un desafío existente.
        Task UpdateAsync(Desafio desafio);

        // Elimina un desafío por su ID.
        Task DeleteAsync(int id);

        // Obtiene una lista de todos los desafíos.
        Task<IEnumerable<Desafio>> GetAllAsync();

        // <summary>
        /// Obtiene el desafío finalizado inmediatamente anterior a la fecha dada.
        /// </summary>
        Task<Desafio> ObtenerDesafioAnteriorAsync(DateTime fechaLimite);
    }
}
