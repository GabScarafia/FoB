using FoB.Application;
using FoB.Application.Interfaces;
using FoB.Infrastructure;
using FoB.Infrastructure.Interface;
using FoB.Infrastructure.Repositories;
using FoB.Infrastructure.Repository;
using FoB.Infrastructure.Service;
using FoB.Infrastructure.Settings;
using FoB.Server.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json.Serialization;
using System.Text;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Add services to the container.

    builder.Services.AddControllers()
        .AddNewtonsoftJson(options =>
        {
            options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
        });
    // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(
        c => {
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                Description = "Ingrese el token con el siguiente formato; - Bearer {su token aqui} para acceder a los recursos protegidos",
            });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer",
                            },
                            Scheme = "Bearer",
                            Name = "Bearer",
                            In = ParameterLocation.Header,
                        }, new List<string>()
                    },
                });
            }
    );
    
    builder.Services.AddDBLayer(builder.Configuration);
    builder.Services.AddApplicationLayer(builder.Configuration);
    builder.Services.AddHttpContextAccessor();

    builder.Services.AddScoped<IRegisterService, RegisterService>();

    builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
    builder.Services.AddScoped<ICurrentUser, FoB.Server.Service.CurrentUserService>();

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
       .AddJwtBearer(o =>
       {
           o.RequireHttpsMetadata = true;
           o.SaveToken = false;
           o.TokenValidationParameters = new TokenValidationParameters
           {
               ValidateIssuerSigningKey = true,
               ValidateIssuer = true,
               ValidateAudience = true,
               ValidateLifetime = true,
               ClockSkew = TimeSpan.Zero,
               ValidIssuer = builder.Configuration["JWTSettings:Issuer"],
               ValidAudience = builder.Configuration["JWTSettings:Audience"],
               IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWTSettings:Key"]))
           };
       });
    builder.Services.Configure<JWTSettings>(builder.Configuration.GetSection("JWTSettings"));
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend",
            policy =>
            {
                policy.AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

    builder.Services.AddScoped<IComentarioRepository, ComentarioRepository>();
    builder.Services.AddScoped<IBusquedaRepository, BusquedaRepository>();
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<BusquedaService>();


    var app = builder.Build();

    // Usar CORS
    app.UseCors("AllowFrontend");

    app.UseDefaultFiles();
    app.UseStaticFiles();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();

    app.UseAuthorization();

    app.MapControllers();

    app.MapFallbackToFile("/index.html");

    app.Run();


}
catch (Exception ex)
{
    Console.WriteLine(ex.ToString());
    throw;
}
