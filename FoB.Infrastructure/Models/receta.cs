namespace FoB.Infrastructure.Models;

public partial class Receta
{
    public int Id { get; set; }

    public bool? Activa { get; set; }

    public string Descripcion { get; set; }

    public string Dificultad { get; set; }

    public string Estado { get; set; }

    public DateTime FechaCreacion { get; set; }

    public DateTime? FechaModificacion { get; set; }

    public float? PuntuacionPromedio { get; set; }

    public TimeOnly? TiempoPreparacion { get; set; }

    public string Titulo { get; set; }

    public int UsuarioId { get; set; }

    public virtual ICollection<Comentario> Comentario { get; set; } = new List<Comentario>();

    public virtual ICollection<IngredienteReceta> IngredienteReceta { get; set; } = new List<IngredienteReceta>();

    public virtual ICollection<ParticipacionDesafio> ParticipacionDesafio { get; set; } = new List<ParticipacionDesafio>();

    public virtual ICollection<Paso> Paso { get; set; } = new List<Paso>();

    public virtual ICollection<RecetaEtiquetas> RecetaEtiquetas { get; set; } = new List<RecetaEtiquetas>();

    public virtual ICollection<RecetaImagen> RecetaImagen { get; set; } = new List<RecetaImagen>();

    public virtual Usuario Usuario { get; set; }

    public virtual ICollection<Voto> Voto { get; set; } = new List<Voto>();


}