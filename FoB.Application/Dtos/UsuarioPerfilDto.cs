using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoB.Application.Dtos
{
    public class UsuarioPerfilDto
    {
        public int Id { get; set; }
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? Biografia { get; set; }
        public string? NombreUsuario { get; set; }

        public string? Email { get; set; }
        // Cambiado: ahora devolvemos la URL de la foto de perfil en vez del Base64
        public string? FotoPerfilUrl { get; set; }
        public int CantidadPublicaciones { get; set; }
        public int CantidadSeguidores { get; set; }
        public int CantidadSeguidos { get; set; }
        public bool EsSeguido { get; set; }

        public List<RecetaDto> Publicaciones { get; set; }
    }
}
