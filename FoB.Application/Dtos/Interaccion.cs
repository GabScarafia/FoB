namespace FoB.Application.Dtos;

public class InteraccionDto
{
    public int IdReceta { get; set; }
    public int? ComentarioId { get; set; }
    public InteraccionTipoEnum Tipo { get; set; }
    public InteraccionAccionEnum Accion{ get; set; }
}

public enum InteraccionTipoEnum
{
    Like,
    Dislike,
    Favorito,
    ComentarioLike
}   

public enum InteraccionAccionEnum
{
    Nuevo,
    Borrar

}
