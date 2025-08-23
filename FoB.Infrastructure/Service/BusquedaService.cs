using FoB.Infrastructure.Interface;
using FoB.Application.Dtos;

public class BusquedaService
{
    private readonly IBusquedaRepository _busquedaRepository;

    public BusquedaService(IBusquedaRepository busquedaRepository)
    {
        _busquedaRepository = busquedaRepository;
    }

    public async Task<List<UsuarioBusquedaDto>> BuscarUsuariosAsync(string termino)
    {
        return await _busquedaRepository.BuscarUsuariosAsync(termino);
    }
}