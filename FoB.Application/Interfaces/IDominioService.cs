using FoB.Application.Dtos;

namespace FoB.Application.Interfaces;



public class DominioDto
{
    public int Id { get; set; }
    public string Nombre { get; set; }
}

public interface DominioService
{
    public Task<List<DominioDto>> GetEtiquestas(string texto);
    public Task<List<DominioDto>> GetIngredientes(string texto);
    public Task<List<DominioDto>> GetUnidades(string texto);
}
