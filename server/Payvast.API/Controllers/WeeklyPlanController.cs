using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.Models;
using Payvast.API.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WeeklyPlanController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<WeeklyPlanController> _logger;

        public WeeklyPlanController(ApplicationDbContext context, ILogger<WeeklyPlanController> logger)
        {
            _context = context;
            _logger = logger;
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

            var plans = await _context.WeeklyPlans
                .Include(p => p.User)
                .Include(p => p.Task)
                .Where(p => targetUserIds.Contains(p.UserId) && 
                            p.PlanDate.Date >= startDate.Date && 
                            p.PlanDate.Date <= endDate.Date)
                .Select(p => new
                {
                    p.Id,
                    p.UserId,
                    UserFullName = p.User.FullName,
                    UserAvatarUrl = p.User.AvatarUrl,
                    p.TaskId,
                    TaskTitle = p.Task != null ? p.Task.Title : null,
                    p.Title,
                    p.Description,
                    p.PlanDate,
                    p.StartHour,
                    p.EndHour,
                    p.IsCompleted,
                    p.Color
                })
                .ToListAsync();

            var result = targetUserIds.Select(uid => new
            {
                UserId = uid,
                FullName = _context.Users.Find(uid)?.FullName ?? "Unassigned",
                AvatarUrl = _context.Users.Find(uid)?.AvatarUrl,
                DailyCapacity = _context.Users.Find(uid)?.DailyCapacityHours ?? 9,
                Plans = plans.Where(p => p.UserId == uid).OrderBy(p => p.PlanDate).ThenBy(p => p.StartHour).ToList()
            }).ToList();

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePlan([FromBody] CreatePlanDto dto)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");

            int targetUserId = (dto.UserId.HasValue && isAdmin) ? dto.UserId.Value : currentUserId;
            var user = await _context.Users.FindAsync(targetUserId);
            if (user == null) return BadRequest("Target user not found in the system.");

            var targetDate = dto.PlanDate.Date;
            var currentTotalHours = await CalculateTotalPlannedHours(targetUserId, targetDate);
            var newPlanHours = dto.EndHour - dto.StartHour;

            if (currentTotalHours + newPlanHours > user.DailyCapacityHours)
            {
                _logger.LogWarning($"Daily capacity exceeded for {user.FullName} on {targetDate}. Total: {currentTotalHours + newPlanHours} > {user.DailyCapacityHours}");
                return BadRequest($"Error: Total planned hours ({currentTotalHours + newPlanHours}) exceeds the specialist's daily capacity limit ({user.DailyCapacityHours} hours).");
            }

            var plan = new WeeklyPlan
            {
                UserId = targetUserId,
                TaskId = dto.TaskId,
                Title = dto.Title,
                Description = dto.Description,
                PlanDate = dto.PlanDate.ToUniversalTime(),
                StartHour = dto.StartHour,
                EndHour = dto.EndHour,
                IsCompleted = false,
                Color = dto.Color ?? "#3b82f6",
                CreatedAt = DateTime.UtcNow,
                SourceType = "Manual"
            };

            _context.WeeklyPlans.Add(plan);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"New plan '{plan.Title}' saved for user {user.FullName} on {plan.PlanDate}.");

            return Ok(plan);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlan(int id, [FromBody] UpdatePlanDto dto)
        {
            var plan = await _context.WeeklyPlans.FindAsync(id);
            if (plan == null) return NotFound();

            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");

            if (!isAdmin && plan.UserId != currentUserId) return Forbid();

            var user = await _context.Users.FindAsync(plan.UserId);
            
            if (plan.PlanDate.Date != dto.PlanDate.Date || plan.StartHour != dto.StartHour || plan.EndHour != dto.EndHour)
            {
                var currentTotalHours = await CalculateTotalPlannedHours(plan.UserId, dto.PlanDate.Date, id);
                var newPlanHours = dto.EndHour - dto.StartHour;

                if (currentTotalHours + newPlanHours > user.DailyCapacityHours)
                {
                    _logger.LogWarning($"Plan changes for ID {id} exceeds daily capacity limit for {user.FullName}.");
                    return BadRequest($"Changes exceed the daily capacity limit ({user.DailyCapacityHours} hours).");
                }
            }

            plan.Title = dto.Title;
            plan.Description = dto.Description;
            plan.PlanDate = dto.PlanDate.ToUniversalTime();
            plan.StartHour = dto.StartHour;
            plan.EndHour = dto.EndHour;
            plan.IsCompleted = dto.IsCompleted;
            plan.Color = dto.Color;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Plan {id} updated successfully.");

            return NoContent();
        }

        private async Task<double> CalculateTotalPlannedHours(int userId, DateTime date, int? excludePlanId = null)
        {
            var manualHours = await _context.WeeklyPlans
                .Where(p => p.UserId == userId && p.PlanDate.Date == date.Date && p.Id != excludePlanId)
                .SumAsync(p => p.EndHour - p.StartHour);

            var ganttTasks = await _context.Tasks
                .Where(t => t.AssigneeId == userId && t.TaskType == "GANTT" && t.StartDate.Date == date.Date)
                .ToListAsync();
            
            var totalGantt = ganttTasks.Sum(t => (double)(t.EstimatedHours ?? 4));

            return manualHours + totalGantt;
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlan(int id)
        {
            var plan = await _context.WeeklyPlans.FindAsync(id);
            if (plan == null) return NotFound();

            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");

            if (!isAdmin && plan.UserId != currentUserId) return Forbid();

            _context.WeeklyPlans.Remove(plan);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Plan {id} deleted.");

            return NoContent();
        }
    }
}