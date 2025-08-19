using FoB.Infrastructure.Context;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace FoB.Infrastructure.Repositories;

internal sealed class RecetaRepository : IRecetaRepository
{
    private readonly fobContext _context;
    public RecetaRepository(fobContext context)
    {
        _context = context;
    }
    public async Task AddAsync(Receta receta)
    {
        await _context.Set<Receta>().AddAsync(receta);
    }
}
