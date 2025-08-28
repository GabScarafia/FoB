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
        public string ImagenPrincipalBase64 { get; set; }
    }
}
