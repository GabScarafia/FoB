using FoB.Application.Dtos;

public interface IBusquedaRepository
{
    Task<List<UsuarioBusquedaDto>> BuscarUsuariosAsync(string termino);
    Task<List<RecetaBusquedaDto>> BuscarRecetasAsync(string termino);
}