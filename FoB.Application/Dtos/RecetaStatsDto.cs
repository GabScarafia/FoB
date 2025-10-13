namespace FoB.Application.Dtos
{
    /// <summary>
    /// DTO para transferir las estadísticas de interacciones de una receta.
    /// </summary>
    public class RecetaStatsDto
    {
        public string NombreUsuario { get; set; }
        public int Likes { get; set; }
        public int Favorites { get; set; }
        public int Visits { get; set; }

    }
}