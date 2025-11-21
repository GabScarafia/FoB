using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoB.Application.Dtos
{
    public class RecetaDto
    {
        public int Id { get; set; }
        public string Titulo { get; set; }
        // ahora devolvemos URL en vez de Base64
        public string ImagenPrincipalUrl { get; set; }
        public string ContentType { get; set; }

        public int? DesafioId { get; set; }
    }
}
