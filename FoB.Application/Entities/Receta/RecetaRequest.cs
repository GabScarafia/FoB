namespace FoB.Application.Entities.Receta;

public class RecetaRequest
{
    public string Titulo { get; set; }
    public string Descripcion { get; set; }
    public byte[] Imagen { get; set; }
    public DificultadEnum Dificultad { get; set; }

    //public EstadoEnum Estado { get; set; }

    public int? TiempoPreparacion { get; set; }

    public List<IngredienteRecetaRequest> Ingredientes { get; set; }
    public List<CategoriaRequest> Categorias { get; set; }
    public List<PasoRequest> Pasos { get; set; }

}

public class PasoRequest
{
    public int Numero { get; set; }
    public string Titulo { get; set; }
    public string Descripcion { get; set; }
}

public class IngredienteRecetaRequest
{
    public int? Id { get; set; }

    public float? Cantidad { get; set; }

    public string UnidadDeMedida { get; set; }

    public string Nombre { get; set; }
    public string? Descripcion { get; set; }

}

public class CategoriaRequest
{
    public int? Id { get; set; }
    public string Nombre { get; set; }
    public string? Descripcion { get; set; }

}


public enum DificultadEnum
{
    Facil,
    Medio,
    Dificil,
    Experto
}

public enum EstadoEnum
{
    Aprobada,
    Rechazada,
    Revision,
    Borrador
}