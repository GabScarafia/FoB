using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FoB.Infrastructure;

/// <summary>
/// Esta clase se usa para importar este proyecto en otro, de cierto modo es el Program.cs de una biblioteca de clases
/// </summary>
public static class ServiceExtensions
{
    public static void AddDBLayer(this IServiceCollection services, IConfiguration _config)
    {

    }
}
