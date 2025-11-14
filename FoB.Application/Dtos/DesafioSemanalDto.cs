using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations; // Necesario para validaciones
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoB.Application.Dtos
{
    // =========================================================================
    // DTOs de DESAFÍO
    // =========================================================================

    /// <summary>
    /// DTO que contiene la información clave del desafío activo (Ingrediente y Descripción).
    /// </summary>
    public class DesafioDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; }

        public string Ingrediente { get; set; }
        public string Descripcion { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
    }

    /// <summary>
    /// DTO para un elemento del ranking. Usado para el ranking completo y el Top 3.
    /// </summary>
    public class RankingDto
    {
        public int Posicion { get; set; }
        public int UsuarioId { get; set; }
        public string NombreUsuario { get; set; }
        public string NombreCompleto { get; set; }
        public int Puntos { get; set; }
        public int? RecetaId { get; set; }
        public string UrlImagenPerfil { get; set; }
        public bool EsGanadorAnterior { get; set; }
    }

    /// <summary>
    /// DTO principal que encapsula la respuesta para el Pop-up/Notificaciones.
    /// Contiene el desafío actual y el ranking (Top 3) de la semana anterior.
    /// </summary>
    public class DesafioSemanalDto
    {
        public DesafioDto DesafioActual { get; set; }

        // Ranking anterior (Top 3), usando el tipo estandarizado RankingDto
        public List<RankingDto> RankingAnterior { get; set; }
    }


    // =========================================================================
    // DTOs de GESTIÓN
    // =========================================================================

    /// <summary>
    /// DTO utilizado para enviar datos al crear un nuevo desafío (POST).
    /// </summary>
    public class CrearDesafioRequestDto
    {
        [Required(ErrorMessage = "El nombre del ingrediente es obligatorio.")]
        [StringLength(100)]
        public string Nombre { get; set; }

        [Required(ErrorMessage = "La descripción del desafío es obligatoria.")]
        [StringLength(500)]
        public string Descripcion { get; set; }

        [Required(ErrorMessage = "El ingrediente del desafío es obligatorio.")]
        [StringLength(500)]
        public string Ingrediente { get; set; }

        [Required(ErrorMessage = "La fecha de inicio es obligatoria.")]
        public DateTime FechaInicio { get; set; }

        [Required(ErrorMessage = "La fecha de fin es obligatoria.")]
        public DateTime FechaFin { get; set; }
    }

    /// <summary>
    /// DTO utilizado para enviar datos al actualizar un desafío existente (PUT).
    /// </summary>
    public class ActualizarDesafioRequestDto : CrearDesafioRequestDto
    {
        [Required(ErrorMessage = "El Id del desafío es obligatorio para la actualización.")]
        public int Id { get; set; }
    }

    /// <summary>
    /// DTO simple de respuesta para operaciones de gestión.
    /// </summary>
    public class DesafioManagementResponseDto
    {
        public int DesafioId { get; set; }
        public string Mensaje { get; set; } = "Operación realizada con éxito.";
    }
}
