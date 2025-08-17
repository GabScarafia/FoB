namespace FoB.Infrastructure.Settings;

public class JWTSettings
{
    public string Key { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public double DurationInMinutes { get; set; }
    public double RefreshTokenExpirationDays { get; set; }
    public double RefreshTokenTTLDays { get; set; }
}