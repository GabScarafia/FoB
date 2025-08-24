namespace FoB.Application.Entities.Receta;

public class RecetaResponse
{
    public int Id { get; set; }

    public string Descripcion { get; set; }

    public string Dificultad { get; set; }

    public string Estado { get; set; }
    public byte[] Imagen { get; set; }

    public DateTime FechaCreacion { get; set; }

    public DateTime? FechaModificacion { get; set; }

    public float? PuntuacionPromedio { get; set; }

    public TimeSpan? TiempoPreparacion { get; set; }

    public string Titulo { get; set; }

    //public int UsuarioId { get; set; }
    public int CantidadVotos { get; set; }
    public bool MeGusta { get; set; } 
    public int CantidadComentarios { get; set; }

    public virtual List<ComentarioResponse> VistaPreviaComentarios { get; set; } = new List<ComentarioResponse>();

    public virtual List<IngredienteResponse> Ingredientes { get; set; } = new List<IngredienteResponse>();

    public virtual List<string> Categorias { get; set; } = new List<string>();

    //public virtual List<RecetaImagen> RecetaImagen { get; set; } = new List<RecetaImagen>();

    public virtual UsuarioResponse Autor { get; set; }

    public virtual List<PasoResponse> Pasos { get; set; } = new List<PasoResponse>();
}


public class PasoResponse
{
    public int Numero { get; set; }
    public string Titulo { get; set; }
    public string Descripcion { get; set; }
}

public class ComentarioResponse
{
    public int Id { get; set; }
    public string Texto { get; set; }
    public DateTime Fecha { get; set; }
    public UsuarioResponse Autor { get; set; }
}
public class UsuarioResponse
{
    public int Id { get; set; }
    public byte[] Imagen { get; set; }
    public string NombreUsuario { get; set; }
    public string Nombre { get; set; }
    public string Apellido { get; set; }
    public string Foto { get; set; } 
}

public class IngredienteResponse
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public float? Cantidad { get; set; }
    public string? UnidadDeMedida { get; set; }
    //public int Cantidad { get; set; }
}
