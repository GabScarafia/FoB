using FoB.Infrastructure.Context;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Repositories
{
    /// <summary>
    /// Repositorio de Desafíos usando EF Core.
    /// </summary>
    public class DesafioRepository : IDesafioRepository
    {
        private readonly fobContext _context;

        public DesafioRepository(fobContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Agrega un nuevo desafío.
        /// </summary>
        public async Task<Desafio> AddAsync(Desafio desafio)
        {
            _context.Desafio.Add(desafio);
            await _context.SaveChangesAsync();
            return desafio;
        }

        /// <summary>
        /// Obtiene el desafío activo.
        /// </summary>
        public async Task<Desafio> GetActiveDesafioAsync()
        {
            return await _context.Desafio.FirstOrDefaultAsync(d => d.Activo == true);

        }

        /// <summary>
        /// Obtiene todos los desafíos.
        /// </summary>
        public async Task<IEnumerable<Desafio>> GetAllAsync()
        {
            return await _context.Desafio.ToListAsync();
        }

        /// <summary>
        /// Obtiene un desafío por ID.
        /// </summary>
        public async Task<Desafio> GetByIdAsync(int id)
        {
            return await _context.Desafio.FindAsync(id);
        }

        /// <summary>
        /// Actualiza un desafío existente.
        /// </summary>
        public async Task UpdateAsync(Desafio desafio)
        {
            _context.Desafio.Update(desafio);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Elimina un desafío por ID.
        /// </summary>
        public async Task DeleteAsync(int id)
        {
            var desafio = await _context.Desafio.FindAsync(id);
            if (desafio != null)
            {
                _context.Desafio.Remove(desafio);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Desafio> ObtenerDesafioAnteriorAsync(DateTime fechaLimite)
        {
            // Busca el desafío cuya fecha de fin es anterior a 'fechaLimite', 
            // y lo ordena para encontrar el más reciente de los terminados.
            return await _context.Desafio
                .Where(d => d.FechaFin < fechaLimite)
                .OrderByDescending(d => d.FechaFin)
                .FirstOrDefaultAsync(); // Toma el más reciente
        }
    }
}
