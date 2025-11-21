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
    public class DominioRepository : DominioService
    {
        private readonly fobContext _context;
        private readonly ICurrentUser _currentUser; // Asegúrate de que ICurrentUser se está inyectando correctamente
        public DominioRepository(fobContext context, ICurrentUser currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }   

        public async Task<List<DominioDto>> GetEtiquestas(string texto)
        {
            var etiquetas = await _context.Etiquetas
                .Where(e => EF.Functions.Like(e.Nombre.ToLower(), $"%{texto.ToLower()}%"))
                .Select(e => new DominioDto
                {
                    Id = e.Id,
                    Nombre = e.Nombre
                })
                .ToListAsync();

            return etiquetas;
        }
        public async Task<List<DominioDto>> GetIngredientes(string texto)
        {
            var etiquetas = await _context.Ingrediente
                .Where(e => EF.Functions.Like(e.Nombre.ToLower(), $"%{texto.ToLower()}%"))
                .Select(e => new DominioDto
                {
                    Id = e.Id,
                    Nombre = e.Nombre
                })
                .ToListAsync();

            return etiquetas;
        }
        public async Task<List<DominioDto>> GetUnidades(string texto)
        {
            var etiquetas = await _context.Unidades
                .Where(e => EF.Functions.Like(e.Nombre.ToLower(), $"%{texto.ToLower()}%"))
                .Select(e => new DominioDto
                {
                    Id = e.Id,
                    Nombre = e.Nombre
                })
                .ToListAsync();

            return etiquetas;
        }
         public async Task<List<DominioDto>> GetUtensilio(string texto)
        {
            var utensilios = await _context.Utensilios
                .Where(e => EF.Functions.Like(e.Nombre.ToLower(), $"%{texto.ToLower()}%"))
                .Select(e => new DominioDto
                {
                    Id = e.Id,
                    Nombre = e.Nombre
                })
                .ToListAsync();

            return utensilios;
        }
    }
}
