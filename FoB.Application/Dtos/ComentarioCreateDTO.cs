using System.ComponentModel.DataAnnotations;

namespace FoB.Application.Dtos;

public class ComentarioCreateDTO
{
    [Required]
    public int IdReceta { get; set; }
    public int? IdComentario { get; set; } // Para respuestas a comentarios

    [Required]
    public string Texto { get; set; }
}
