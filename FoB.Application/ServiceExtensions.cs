using FoB.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FoB.Application;

/// <summary>
/// Esta clase se usa para importar este proyecto en otro, de cierto modo es el Program.cs de una biblioteca de clases
/// </summary>
public static class ServiceExtensions
{
    public static void AddApplicationLayer(this IServiceCollection services, IConfiguration _config)
    {

    }
}
