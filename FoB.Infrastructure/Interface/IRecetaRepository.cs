using FoB.Application.Dtos;
using FoB.Application.Entities.Receta;

namespace FoB.Infrastructure.Interface;

public interface IRecetaRepository
{
    public Task<bool> CreateAsync(RecetaRequest receta);
    public Task<IEnumerable<RecetaResponse>> FeedAsync(int pageNumber = 1, int pageSize = 5);
    public Task<IEnumerable<RecetaResponse>> TendenciasAsync(int pageNumber = 1, int pageSize = 15);
    public Task<bool> EstaSiguiendoAlguienAsync();
    public Task<bool> LikeOrDislike(int idReceta);
    public Task<bool> Interaccion(InteraccionDto interaccion);
    Task<bool> DeleteAsync(int recetaId);

    public Task<RecetaResponse> GetById(int idReceta);


    /// <summary>
    /// Obtiene las estadísticas de interacciones y datos clave del usuario 
    /// asociados a una receta de una fecha específica para el cálculo de puntos.
    /// </summary>
    Task<RecetaStatsDto> GetRecetaStatsAsync(int recetaId, DateTime asOfDate);


}
