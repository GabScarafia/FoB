using FoB.Application.Dtos;

namespace FoB.Application.Interfaces;



public class EtiquetasDto
{
    public int Id { get; set; }
    public string Nombre { get; set; }
}

public interface IEtiquetasService
{
    public Task<List<EtiquetasDto>> GetEtiquestas(string texto);
}
