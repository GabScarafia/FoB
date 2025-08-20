using FoB.Application.Entities;

namespace FoB.Infrastructure.Interface;

public interface IRecetaRepository
{
    public Task<bool> CreateAsync(RecetaRequest receta);
}
