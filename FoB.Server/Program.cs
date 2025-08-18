using FoB.Application;
using FoB.Application.Interfaces;
using FoB.Infrastructure;
using FoB.Infrastructure.Repositories;
using FoB.Infrastructure.Settings;
using FoB.Infrastructure.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Add services to the container.

    builder.Services.AddControllers();
    // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddDBLayer(builder.Configuration);
    builder.Services.AddApplicationLayer(builder.Configuration);

    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IRegisterService, RegisterService>();

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
