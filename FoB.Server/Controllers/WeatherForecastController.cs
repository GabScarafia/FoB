using FoB.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FoB.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private readonly IWeatherService _weatherService;

        private readonly ILogger<WeatherForecastController> _logger;

        public WeatherForecastController(ILogger<WeatherForecastController> logger, IWeatherService weatherService)
        {
            _logger = logger;
            _weatherService= weatherService;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(_weatherService.Get());
        }
    }
}
