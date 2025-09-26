// src/Application/Interfaces/IComentarioRepository.cs
using FoB.Application.Entities;
using FoB.Application.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FoB.Application.Interfaces
{
    public interface IComentarioRepository
    {
        Task<IEnumerable<ComentarioDTO>> GetByRecetaAsync(int idReceta);
        Task<ComentarioDTO> AddAsync(ComentarioCreateDTO comentario); // <- Este es el tipo de entrada correcto
        Task DeleteAsync(int id);
        Task<ComentarioDTO> GetByIdAsync(int id);
        Task<ComentarioDTO> UpdateAsync(int id, ComentarioUpdateDTO dto);
    }
}