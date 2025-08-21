using FoB.Application.Entities.Receta;
using FoB.Infrastructure.Models;

namespace FoB.Infrastructure.Interface;

public interface IRecetaRepository
{
    public Task<bool> CreateAsync(RecetaRequest receta);
    public Task<IEnumerable<RecetaResponse>> FeedAsync(int pageNumber = 1);
    public Task<IEnumerable<RecetaResponse>> TendenciasAsync(int pageNumber = 1);
}
