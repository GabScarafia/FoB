using FoB.Application.Entities.Receta;

namespace FoB.Application.Dtos;

public class RecetaBusquedaDto
{
    public int Id { get; set; }
    public string Titulo { get; set; }
    public virtual UsuarioResponse Autor { get; set; }
}
