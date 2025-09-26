using System;
using System.ComponentModel.DataAnnotations;

namespace FoB.Application.Dtos
{
    public class ComentarioDTO
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public int IdReceta { get; set; }

        [Required]
        public string Texto { get; set; }

        [Required]
        public DateTime Fecha { get; set; }

        [Required]
        public UsuarioComentarioDTO Usuario { get; set; }
        public int? RespuestaAComentarioId { get; set; }

        public List<ComentarioDTO> Respuestas { get; set; } = new List<ComentarioDTO>();
    }
}

public class UsuarioComentarioDTO
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public string Apellido { get; set; }
    public string NombreUsuario { get; set; }
    public byte[] Imagen { get; set; }
}
