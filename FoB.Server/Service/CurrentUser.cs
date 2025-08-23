using FoB.Application.Dtos;
using FoB.Application.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FoB.Server.Service
{
    public class CurrentUserService : ICurrentUser
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public UsuarioDto User
        {
            get
            {
                if (_httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated == true)
                {
                    var claims = _httpContextAccessor.HttpContext.User.Claims;
                    var idClaim = claims.FirstOrDefault(q => q.Type == JwtRegisteredClaimNames.Sid)?.Value;
                    var nombreClaim = claims.FirstOrDefault(q => q.Type == ClaimTypes.Name)?.Value;
                    var emailClaim = claims.FirstOrDefault(q => q.Type == ClaimTypes.Email)?.Value;


                    if (int.TryParse(idClaim, out int userId))
                    {
                        // Mapear los claims al DTO
                        return new UsuarioDto
                        {
                            Id = userId,
                            Nombre = nombreClaim,
                            Email = emailClaim,
                           
                        };
                    }
                }
                return null;
            }
        }
        public bool IsInRole(string roleName) => _httpContextAccessor.HttpContext!.User.IsInRole(roleName);
    }
}