using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoB.Application.Dtos
{
    public class UsuarioBusquedaDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Apellido { get; set; }
        public string NombreUsuario { get; set; }
        public string Imagen { get; set; }
        public bool IsFollowing { get; set; }
    }
}
