using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.Hubs;
using Microsoft.Extensions.Logging;

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
            _logger.LogInformation("ReminderService started.");
            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromSeconds(30));
            return Task.CompletedTask;
        }

        private async void DoWork(object state)
        {
            _logger.LogInformation("ReminderService checking for reminders at: {time}", DateTime.UtcNow);

            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var now = DateTime.UtcNow;

                // 1. یادآوری‌های یادداشت‌ها (Notes)
                var noteReminders = await dbContext.Notes
                    .Where(n => n.ReminderDate.HasValue && !n.ReminderSent &&
                                n.ReminderDate.Value.AddMinutes(-(n.ReminderOffsetMinutes ?? 0)) <= now)
                    .ToListAsync();

                // 2. یادآوری‌های پیگیری‌ها (ProjectFollowUps)
                var followUpReminders = await dbContext.ProjectFollowUps
                    .Where(f => f.ReminderDate.HasValue && !f.ReminderSent &&
                                f.ReminderDate.Value <= now && !f.IsResolved)
                    .ToListAsync();

                if (!noteReminders.Any() && !followUpReminders.Any())
                {
                    _logger.LogInformation("No reminders to send in this cycle.");
                    return;
                }

                // ارسال یادآوری برای Notes
                foreach (var note in noteReminders)
                {
                    _logger.LogInformation($"Sending reminder for Note ID: {note.Id}, Title: '{note.Title}' to User ID: {note.UserId}");
                    await _hubContext.Clients.User(note.UserId.ToString()).SendAsync("ReceiveReminder", new
                    {
                        note.Id,
                        note.Title,
                        Content = note.Content ?? "زمان یادآوری فرا رسیده است.",
                        Type = "Note"
                    });
                    note.ReminderSent = true;
                }

                // ارسال یادآوری برای ProjectFollowUps
                foreach (var followUp in followUpReminders)
                {
                    var project = await dbContext.Projects.FindAsync(followUp.ProjectId);
                    var projectTitle = project?.Title ?? "پروژه نامشخص";
                    _logger.LogInformation($"Sending reminder for FollowUp ID: {followUp.Id}, Project: {projectTitle} to User ID: {followUp.UserId}");
                    await _hubContext.Clients.User(followUp.UserId.ToString()).SendAsync("ReceiveReminder", new
                    {
                        Id = followUp.Id,
                        Title = $"پیگیری پروژه {projectTitle}",
                        Content = followUp.Content,
                        Type = "FollowUp",
                        ProjectId = followUp.ProjectId
                    });
                    followUp.ReminderSent = true;
                }

                await dbContext.SaveChangesAsync();
                _logger.LogInformation($"Processed {noteReminders.Count} note reminders and {followUpReminders.Count} follow-up reminders.");
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