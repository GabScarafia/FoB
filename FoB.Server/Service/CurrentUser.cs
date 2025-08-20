using FoB.Application.Interfaces;
using System.IdentityModel.Tokens.Jwt;

namespace FoB.Server.Service
{

    public class CurrentUserService : ICurrentUser
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;

            if (_httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated == true)
            {
                var id = _httpContextAccessor.HttpContext.User.Claims?
                    .FirstOrDefault(q => q.Type == JwtRegisteredClaimNames.Sid)?
                    .Value;

                var userName = _httpContextAccessor.HttpContext.User.Identity.Name;

                User = new CurrentUser(Convert.ToInt32(id), userName);
            }
        }

        public CurrentUser User { get; }

        public bool IsInRole(string roleName) => _httpContextAccessor.HttpContext!.User.IsInRole(roleName);

    }
}
