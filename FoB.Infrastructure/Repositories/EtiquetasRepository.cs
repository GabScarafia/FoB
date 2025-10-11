using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Repositories
{
    public class EtiquetasRepository : IEtiquetasService
    {
        private readonly fobContext _context;
        private readonly ICurrentUser _currentUser; // Asegúrate de que ICurrentUser se está inyectando correctamente
        public EtiquetasRepository(fobContext context, ICurrentUser currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }   

  public async Task<List<EtiquetasDto>> GetEtiquestas(string texto)
        {
            var etiquetas = await _context.Etiquetas
                .Where(e => EF.Functions.Like(e.Nombre.ToLower(), $"%{texto.ToLower()}%"))
                .Select(e => new EtiquetasDto
                {
                    Id = e.Id,
                    Nombre = e.Nombre
                })
                .ToListAsync();

            return etiquetas;
        }
    }
}
