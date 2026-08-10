using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.Hubs;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Payvast.API.Services
{
    public class ReminderService : IHostedService, IDisposable
    {
        private Timer _timer;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ILogger<ReminderService> _logger;

        public ReminderService(IServiceScopeFactory scopeFactory, IHubContext<ChatHub> hubContext, ILogger<ReminderService> logger)
        {
            _scopeFactory = scopeFactory;
            _hubContext = hubContext;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("ReminderService started. Checking every 5 seconds...");
            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromSeconds(5));
            return Task.CompletedTask;
        }

        private async void DoWork(object state)
        {
            try
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var nowUtc = DateTime.UtcNow;

                    // 1. Note Reminders
                    var pendingNotes = await dbContext.Notes
                        .Where(n => n.ReminderDate.HasValue && !n.ReminderSent)
                        .ToListAsync();

                    var dueNotes = pendingNotes.Where(n => {
                        var reminderUtc = DateTime.SpecifyKind(n.ReminderDate.Value, DateTimeKind.Utc);
                        var triggerTime = reminderUtc.AddMinutes(-(n.ReminderOffsetMinutes ?? 0));
                        return triggerTime <= nowUtc;
                    }).ToList();

                    // 2. FollowUp Reminders
                    var pendingFollowUps = await dbContext.ProjectFollowUps
                        .Where(f => f.ReminderDate.HasValue && !f.ReminderSent && !f.IsResolved)
                        .ToListAsync();

                    var dueFollowUps = pendingFollowUps.Where(f => {
                        var reminderUtc = DateTime.SpecifyKind(f.ReminderDate.Value, DateTimeKind.Utc);
                        return reminderUtc <= nowUtc;
                    }).ToList();

                    if (!dueNotes.Any() && !dueFollowUps.Any())
                    {
                        return;
                    }

                    foreach (var note in dueNotes)
                    {
                        _logger.LogInformation($"[ReminderService] Triggering Note Reminder ID: {note.Id}, Title: '{note.Title}' for User: {note.UserId}");
                        
                        var payload = new
                        {
                            Id = note.Id,
                            UserId = note.UserId,
                            Title = note.Title,
                            Content = note.Content ?? "Reminder alert",
                            Type = "Note"
                        };

                        await _hubContext.Clients.All.SendAsync("ReceiveReminder", payload);
                        note.ReminderSent = true;
                    }

                    foreach (var followUp in dueFollowUps)
                    {
                        var project = await dbContext.Projects.FindAsync(followUp.ProjectId);
                        var projectTitle = project?.Title ?? "Project";
                        _logger.LogInformation($"[ReminderService] Triggering FollowUp Reminder ID: {followUp.Id} for User: {followUp.UserId}");
                        
                        var payload = new
                        {
                            Id = followUp.Id,
                            UserId = followUp.UserId,
                            Title = $"FollowUp: {projectTitle}",
                            Content = followUp.Content,
                            Type = "FollowUp",
                            ProjectId = followUp.ProjectId
                        };

                        await _hubContext.Clients.All.SendAsync("ReceiveReminder", payload);
                        followUp.ReminderSent = true;
                    }

                    await dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing ReminderService cycle");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("ReminderService stopping.");
            _timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }
    }
}