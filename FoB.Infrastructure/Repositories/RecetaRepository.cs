using FoB.Application.Entities;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace FoB.Infrastructure.Repositories;

internal sealed class RecetaRepository : IRecetaRepository
{
    private readonly fobContext _context;
    private readonly ICurrentUser _currentUser;
    public RecetaRepository(fobContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<bool> CreateAsync(RecetaRequest receta)
    {
        Receta nuevaReceta = new()
        {
            Titulo = receta.Titulo,
            Descripcion = receta.Descripcion,
            Activa = true,
            UsuarioId = _currentUser.User.Id,
            Estado = EstadoEnum.Revision.ToString(),
            Dificultad = receta.Dificultad.ToString(),
            FechaCreacion = DateTime.Now,
        };
        if (receta.TiempoPreparacion.HasValue)
            nuevaReceta.TiempoPreparacion = TimeOnly.FromTimeSpan(receta.TiempoPreparacion.Value);

        List<IngredienteReceta> ingredienteRecetas = new();
        if(receta.Ingredientes != null && receta.Ingredientes.Count > 0)
        {
            foreach (var item in receta.Ingredientes)
            {
                var ingrediente = await IngredienteCreateIfNotExist(item); 
                IngredienteReceta ingredienteReceta = new()
                {
                    IngredienteId = ingrediente.Id,
                    UnidadDeMedida = item.UnidadDeMedida,
                    Cantidad = item.Cantidad,
                };
                ingredienteRecetas.Add(ingredienteReceta);
            }
            nuevaReceta.IngredienteReceta = ingredienteRecetas;
        }

        List<RecetaCategoria> categoriaRecetas = new();
        if (receta.Categorias != null && receta.Categorias.Count > 0)
        {
            foreach (var item in receta.Categorias)
            {
                var categoria = await CategoriaCreateIfNotExist(item);
                RecetaCategoria categoriaReceta = new()
                {
                    CategoriaId = categoria.Id
                };
                categoriaRecetas.Add(categoriaReceta);
            }
            nuevaReceta.IngredienteReceta = ingredienteRecetas;
        }
        await _context.Set<Receta>().AddAsync(nuevaReceta);
        await _context.SaveChangesAsync();

        return true;
    }

    private async Task<Ingrediente> IngredienteCreateIfNotExist(IngredienteRecetaRequest ingredienteRecetaRequest)
    {
        var ig = await _context.Set<Ingrediente>().FirstOrDefaultAsync(x=>x.Id == ingredienteRecetaRequest.Id || x.Nombre == ingredienteRecetaRequest.Nombre );
        if (ig != null)
            return ig;
        else
        {
            ig = new Ingrediente() { Nombre = ingredienteRecetaRequest.Nombre, Descripcion = ingredienteRecetaRequest.Descripcion};
            await _context.Set<Ingrediente>().AddAsync(ig);
            await _context.SaveChangesAsync();
            return ig;
        }    
    }
    private async Task<Categoria> CategoriaCreateIfNotExist(CategoriaRequest categoriaRequest)
    {
        var categoria = await _context.Set<Categoria>().FirstOrDefaultAsync(x => x.Id == categoriaRequest.Id || x.Nombre == categoriaRequest.Nombre);
        if (categoria != null)
            return categoria;
        else
        {
            categoria = new Categoria() { Nombre = categoriaRequest.Nombre, Descripcion = categoriaRequest.Descripcion };
            await _context.Set<Categoria>().AddAsync(categoria);
            await _context.SaveChangesAsync();
            return categoria;
        }
    }
}
