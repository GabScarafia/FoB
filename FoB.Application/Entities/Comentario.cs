using FoB.Application.Dtos;
using System;

namespace FoB.Application.Entities;

public class ComentarioRequest
{
    public int Id { get; set; }

    public DateTime? Fecha { get; set; }

    public DateTime? FechaModificacion { get; set; }

    public string Texto { get; set; }

    public int RecetaId { get; set; }

    public int UsuarioId { get; set; }

    public int? RespuestaAComentarioId { get; set; }

}
