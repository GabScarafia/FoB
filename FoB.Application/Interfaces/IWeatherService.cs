using FoB.Application.Entities;

namespace FoB.Application.Interfaces;

public interface IWeatherService
{
    public IEnumerable<WeatherForecast> Get();
}
