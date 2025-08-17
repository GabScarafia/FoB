using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using FoB.Infrastructure.Context;
using FoB.Infrastructure.Models;
using FoB.Infrastructure.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace FoB.Infrastructure.Service;

public class AuthenticationService : IAuthenticationService
{
    private readonly fobContext _fbContext;
    private readonly JWTSettings _JWTSettings;

    public AuthenticationService(IOptions<JWTSettings> JWTSettings, fobContext fbContext) 
    {  
        _fbContext = fbContext; 
        _JWTSettings = JWTSettings.Value;

        if (string.IsNullOrEmpty(_JWTSettings.Key))
            throw new Exception("JWT secret not configured");
    }

    public async Task<UsuarioDto> Login(string email, string password)
    {
        var user = await _fbContext.Set<Usuario>().Include(x=>x.Rols).FirstOrDefaultAsync(x=>x.Email == email && x.Contrasena == password);

        if(user == null)
            return null;
        else
        {
            UsuarioDto usuarioDto = new UsuarioDto()
            {
                Email = user.Email,
                Id = user.Id,
                Nombre = user.Nombre,
                Roles = user.Rols.Select(x=>x.Nombre).ToList()
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var securityKey = Encoding.ASCII.GetBytes(_JWTSettings.Key!);
            DateTime expDate = DateTime.UtcNow.AddMinutes(_JWTSettings.DurationInMinutes);
            var roleClaims = new List<Claim>();
            foreach (var item in user.Rols)
                roleClaims.Add(new Claim(ClaimTypes.Role, item.Descripcion));

            ClaimsIdentity claims = new ClaimsIdentity(new[]
           {
                    new Claim("id", user.Id.ToString() ?? "-1"),
                    new Claim(JwtRegisteredClaimNames.Sid, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Nombre),
                    new Claim(ClaimTypes.Email, user.Email)
            }
          .Union(roleClaims));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = claims,
                Expires = expDate,
                Audience = _JWTSettings.Audience,
                Issuer = _JWTSettings.Issuer,
                NotBefore = DateTime.UtcNow.AddMinutes(-5),
                IssuedAt = DateTime.UtcNow.AddMinutes(-5),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(securityKey), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenProcessed = (tokenHandler.WriteToken(token).ToString(), expDate);
            usuarioDto.Token = tokenProcessed.Item1;
            usuarioDto.ExpDate = tokenProcessed.Item2;
            return usuarioDto;
        }

    }
}
