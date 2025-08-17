using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Service;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FoB.Infrastructure;

/// <summary>
/// Esta clase se usa para importar este proyecto en otro, de cierto modo es el Program.cs de una biblioteca de clases
/// </summary>
public static class ServiceExtensions
{
    public static void AddDBLayer(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<fobContext>(options =>
                                    options.UseMySql(
                                        configuration.GetConnectionString("fobConnection"),
                                        ServerVersion.AutoDetect(configuration.GetConnectionString("fobConnection")),
                                        mySqlOptions =>
                                        {
                                            mySqlOptions.MigrationsAssembly(typeof(fobContext).Assembly.FullName);
                                            mySqlOptions.CommandTimeout(60);
                                        })
                                    .EnableDetailedErrors());

        services.AddTransient<IAuthenticationService, AuthenticationService>();
    }
}
