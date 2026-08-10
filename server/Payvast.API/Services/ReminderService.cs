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

        public ReminderService(IServiceScopeFactory scopeFactory, IHubContext<ChatHub> hubContext, ILogger<ReminderService> _logger)
        {
            _scopeFactory = scopeFactory;
            _hubContext = hubContext;
            this._logger = _logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("ReminderService started.");
            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromSeconds(15));
            return Task.CompletedTask;
        }

        private async void DoWork(object state)
        {
            try
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var now = DateTime.UtcNow;

                    // 1. Note Reminders
                    var noteReminders = await dbContext.Notes
                        .Where(n => n.ReminderDate.HasValue && !n.ReminderSent)
                        .ToListAsync();

                    var dueNotes = noteReminders
                        .Where(n => n.ReminderDate.Value.AddMinutes(-(n.ReminderOffsetMinutes ?? 0)) <= now)
                        .ToList();

                    // 2. FollowUp Reminders
                    var followUpReminders = await dbContext.ProjectFollowUps
                        .Where(f => f.ReminderDate.HasValue && !f.ReminderSent && !f.IsResolved)
                        .ToListAsync();

                    var dueFollowUps = followUpReminders
                        .Where(f => f.ReminderDate.Value <= now)
                        .ToList();

                    if (!dueNotes.Any() && !dueFollowUps.Any())
                    {
                        return;
                    }

                    foreach (var note in dueNotes)
                    {
                        _logger.LogInformation($"[ReminderService] Triggering Note Reminder ID: {note.Id}, Title: '{note.Title}'");
                        await _hubContext.Clients.User(note.UserId.ToString()).SendAsync("ReceiveReminder", new
                        {
                            note.Id,
                            note.Title,
                            Content = note.Content ?? "Reminder alert",
                            Type = "Note"
                        });
                        note.ReminderSent = true;
                    }

                    foreach (var followUp in dueFollowUps)
                    {
                        var project = await dbContext.Projects.FindAsync(followUp.ProjectId);
                        var projectTitle = project?.Title ?? "Project";
                        _logger.LogInformation($"[ReminderService] Triggering FollowUp Reminder ID: {followUp.Id}");
                        await _hubContext.Clients.User(followUp.UserId.ToString()).SendAsync("ReceiveReminder", new
                        {
                            Id = followUp.Id,
                            Title = $"FollowUp: {projectTitle}",
                            Content = followUp.Content,
                            Type = "FollowUp",
                            ProjectId = followUp.ProjectId
                        });
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