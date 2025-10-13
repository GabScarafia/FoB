using FoB.Infrastructure.Context;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Repositories
{
    /// <summary>
    /// Implementación concreta de IDesafioParticipacionRepository que utiliza 
    /// Entity Framework Core para la persistencia real de datos.
    /// </summary>
    public class DesafioParticipacionRepository : IDesafioParticipacionRepository
    {
        private readonly fobContext _context;

        public DesafioParticipacionRepository(fobContext context)
        {
            _context = context;
        }


        /// <summary>
        /// Agrega una nueva participación.
        /// </summary>
        public async Task AddAsync(ParticipacionDesafio participacion)
        {
            // Agrega la entidad al DbSet.
            await _context.ParticipacionDesafio.AddAsync(participacion);

            // Guarda los cambios en la base de datos.
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Obtiene todas las participaciones de un desafío específico.
        /// </summary>
        public async Task<IEnumerable<ParticipacionDesafio>> GetByDesafioIdAsync(int desafioId)
        {
            // Consulta real a la base de datos de forma asíncrona.
            return await _context.ParticipacionDesafio
                .Where(p => p.DesafioId == desafioId)
                .ToListAsync();
        }

        /// <summary>
        /// Actualiza una participación existente (principalmente la propiedad Puntos).
        /// </summary>
        public async Task UpdateAsync(ParticipacionDesafio participacion)
        {
            // Marca la entidad como modificada
            _context.Entry(participacion).State = EntityState.Modified;

            // Guarda los cambios.
            await _context.SaveChangesAsync();
        }
    }
}