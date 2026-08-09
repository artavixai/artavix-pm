using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UnifiedScheduleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UnifiedScheduleController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("team-schedule")]
        public async Task<IActionResult> GetTeamSchedule(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] int? userId = null)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");

            List<int> targetUserIds;
            if (userId.HasValue && (isAdmin || userId.Value == currentUserId))
                targetUserIds = new List<int> { userId.Value };
            else if (isAdmin && !userId.HasValue)
                targetUserIds = await _context.Users.Where(u => u.IsActive).Select(u => u.Id).ToListAsync();
            else
                targetUserIds = new List<int> { currentUserId };

            // برنامه‌های دستی
            var manualPlans = await _context.WeeklyPlans
                .Include(p => p.User)
                .Where(p => targetUserIds.Contains(p.UserId) && 
                            p.PlanDate.Date >= startDate.Date && 
                            p.PlanDate.Date <= endDate.Date)
                .Select(p => new PlanDisplayDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    UserFullName = p.User.FullName,
                    UserAvatarUrl = p.User.AvatarUrl,
                    Title = p.Title,
                    ProjectTitle = "برنامه دستی",
                    Description = p.Description,
                    PlanDate = p.PlanDate,
                    StartHour = p.StartHour,
                    EndHour = p.EndHour,
                    IsCompleted = p.IsCompleted,
                    Color = p.Color,
                    IsTask = false
                })
                .ToListAsync();

            // تسک‌های گانت (سیستمی)
            var ganttTasksRaw = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.Project)
                .Where(t => t.TaskType == "GANTT" &&
                            t.AssigneeId.HasValue &&
                            targetUserIds.Contains(t.AssigneeId.Value) &&
                            t.StartDate.Date <= endDate.Date && 
                            t.DueDate.HasValue && t.DueDate.Value.Date >= startDate.Date)
                .OrderBy(t => t.AssigneeId).ThenBy(t => t.StartDate).ThenBy(t => t.Id)
                .ToListAsync();

            var ganttPlans = new List<PlanDisplayDto>();

            foreach (var userGroup in ganttTasksRaw.GroupBy(t => t.AssigneeId))
            {
                var uId = userGroup.Key.Value;
                for (var dt = startDate.Date; dt <= endDate.Date; dt = dt.AddDays(1))
                {
                    var tasksForDay = userGroup.Where(t => t.StartDate.Date == dt).ToList();
                    double currentStart = 8.5;

                    foreach (var task in tasksForDay)
                    {
                        double duration = (double)(task.EstimatedHours ?? 4);
                        ganttPlans.Add(new PlanDisplayDto
                        {
                            Id = task.Id,
                            UserId = uId,
                            UserFullName = task.Assignee.FullName,
                            UserAvatarUrl = task.Assignee.AvatarUrl,
                            Title = task.Title,
                            ProjectTitle = task.Project.Title,
                            PlanDate = dt,
                            StartHour = currentStart,
                            EndHour = currentStart + duration,
                            IsCompleted = (task.Progress >= 100),
                            Color = task.PlannedColor ?? "#3b82f6",
                            IsTask = true
                        });
                        currentStart += duration + 0.5;
                    }
                }
            }

            var allItems = manualPlans.Concat(ganttPlans).ToList();

            var result = targetUserIds.Select(uid => {
                var user = _context.Users.Find(uid);
                return new
                {
                    UserId = uid,
                    FullName = user?.FullName ?? "نامشخص",
                    AvatarUrl = user?.AvatarUrl,
                    DailyCapacity = user?.DailyCapacityHours ?? 9,
                    Plans = allItems
                        .Where(item => item.UserId == uid)
                        .OrderBy(item => item.PlanDate)
                        .ThenBy(item => item.StartHour)
                        .ToList()
                };
            }).ToList();

            return Ok(result);
        }

        [HttpPut("move-task")]
        public async Task<IActionResult> MoveGanttTask([FromBody] MoveGanttTaskDto dto)
        {
            var task = await _context.Tasks.FindAsync(dto.TaskId);
            if (task == null) return NotFound();

            var diff = dto.NewDate.Date - task.StartDate.Date;
            task.StartDate = task.StartDate.Add(diff);
            if (task.DueDate.HasValue) task.DueDate = task.DueDate.Value.Add(diff);

            // به‌روزرسانی برنامه هفتگی مرتبط (در صورت وجود)
            var relatedPlan = await _context.WeeklyPlans
                .FirstOrDefaultAsync(w => w.TaskId == dto.TaskId && w.SourceType == "Gantt");
            if (relatedPlan != null)
            {
                relatedPlan.PlanDate = dto.NewDate.Date;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}