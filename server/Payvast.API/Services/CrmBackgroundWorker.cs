using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;

namespace Payvast.API.Services
{
    public class CrmBackgroundWorker : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<CrmBackgroundWorker> _logger;

        public CrmBackgroundWorker(IServiceProvider services, ILogger<CrmBackgroundWorker> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("CRM Background Worker Started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _services.CreateScope())
                    {
                        var scraper = scope.ServiceProvider.GetRequiredService<CrmScraperService>();
                        await scraper.SyncCrmDataAsync();
                    }
                    _logger.LogInformation("CRM Data Synced Successfully.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error syncing CRM data.");
                }

                // ===== تغییر از 1 ساعت به 10 دقیقه =====
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
        }
    }
}