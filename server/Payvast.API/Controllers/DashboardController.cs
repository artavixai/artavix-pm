using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetStats()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId = string.IsNullOrEmpty(userIdStr) ? 0 : int.Parse(userIdStr);
            var now = DateTime.UtcNow;

            // ۱. تسک‌های فعال کاربر جاری
            var inProgressTasks = await _context.Tasks
                .CountAsync(t => t.AssigneeId == userId && (t.Status == "InProgress" || t.Status == "In Progress"));

            // ۲. تسک‌های امروز کاربر
            var todaysTasks = await _context.Tasks
                .CountAsync(t => t.AssigneeId == userId && t.StartDate.Date == now.Date);

            // ۳. پروژه‌های فعال و کل پروژه‌ها
            var allProjects = await _context.Projects
                .AsNoTracking()
                .ToListAsync();

            var activeProjectsCount = allProjects.Count(p => p.Status == "In Progress" || p.Status == "در حال اجرا");
            var completedProjectsCount = allProjects.Count(p => p.Status == "Completed" || p.Status == "تکمیل شده" || p.Progress >= 100);

            var criticalProjectsCount = allProjects.Count(p => 
                (p.EndDate.HasValue && p.EndDate.Value < now && p.Progress < 100) ||
                p.Status == "Critical" || p.Status == "بحرانی"
            );

            double overallProgress = allProjects.Any() 
                ? Math.Round(allProjects.Average(p => p.Progress), 1) 
                : 0;

            // ۴. محاسبات ساعات کار برآورد و تخصیص
            var ganttTasks = await _context.Tasks
                .Where(t => t.TaskType == "GANTT")
                .AsNoTracking()
                .ToListAsync();

            decimal totalEstimatedHours = ganttTasks.Sum(t => t.EstimatedHours ?? 0);
            decimal totalAllocatedHours = ganttTasks.Sum(t => t.AllocatedHours ?? 0);

            // ۵. نمودار ۱: توزیع وضعیت پروژه‌ها
            var statusDistribution = new List<ProjectStatusDistributionDto>
            {
                new ProjectStatusDistributionDto { Name = "In Progress", Value = activeProjectsCount, Color = "#3b82f6" },
                new ProjectStatusDistributionDto { Name = "Completed", Value = completedProjectsCount, Color = "#10b981" },
                new ProjectStatusDistributionDto { Name = "Planned", Value = allProjects.Count(p => p.Status == "Planned" || p.Status == "برنامه‌ریزی شده"), Color = "#f59e0b" },
                new ProjectStatusDistributionDto { Name = "Suspended", Value = allProjects.Count(p => p.Status == "Suspended" || p.Status == "معلق"), Color = "#64748b" },
                new ProjectStatusDistributionDto { Name = "Critical", Value = criticalProjectsCount, Color = "#ef4444" }
            }.Where(x => x.Value > 0).ToList();

            // ۶. نمودار ۲: بار کاری ۵ کارشناس برتر
            var topSpecialists = await _context.Tasks
                .Where(t => t.TaskType == "GANTT" && t.AssigneeId.HasValue && t.AllocatedHours > 0)
                .Include(t => t.Assignee)
                .AsNoTracking()
                .ToListAsync();

            var topSpecialistsWorkload = topSpecialists
                .GroupBy(t => t.AssigneeId)
                .Select(g => new SpecialistWorkloadDto
                {
                    FullName = g.First().Assignee?.FullName ?? "Unassigned",
                    AvatarUrl = g.First().Assignee?.AvatarUrl,
                    EstimatedHours = g.Sum(t => t.EstimatedHours ?? 0),
                    AllocatedHours = g.Sum(t => t.AllocatedHours ?? 0)
                })
                .OrderByDescending(x => x.AllocatedHours)
                .Take(5)
                .ToList();

            // ۷. ویجت ۱: پیگیری‌ها و فعالیت‌های اخیر
            var recentFollowUps = await _context.ProjectFollowUps
                .Include(f => f.Project)
                .Include(f => f.User)
                .OrderByDescending(f => f.CreatedAt)
                .Take(5)
                .AsNoTracking()
                .Select(f => new RecentActivityDto
                {
                    Id = f.Id,
                    ProjectId = f.ProjectId,
                    ProjectTitle = f.Project != null ? f.Project.Title : "General Project",
                    Content = f.Content,
                    UserFullName = f.User != null ? f.User.FullName : "System User",
                    Date = f.FollowUpDate,
                    Type = "FollowUp",
                    IsResolved = f.IsResolved
                })
                .ToListAsync();

            // ۸. ویجت ۲: جلسات پیش‌رو
            var upcomingMeetings = await _context.Meetings
                .Include(m => m.Project)
                .Where(m => m.StartTime >= now.AddDays(-1))
                .OrderBy(m => m.StartTime)
                .Take(4)
                .AsNoTracking()
                .Select(m => new UpcomingMeetingDto
                {
                    Id = m.Id,
                    Title = m.Title,
                    StartTime = m.StartTime,
                    EndTime = m.EndTime,
                    ProjectTitle = m.Project != null ? m.Project.Title : "General Meeting",
                    Color = m.Color ?? "#3b82f6"
                })
                .ToListAsync();

            var stats = new DashboardStatsDto
            {
                InProgressTasks = inProgressTasks,
                ActiveProjects = activeProjectsCount,
                TrackableTasks = allProjects.Count,
                TodaysTasks = todaysTasks,
                CriticalProjectsCount = criticalProjectsCount,
                CompletedProjectsCount = completedProjectsCount,
                TotalEstimatedHours = totalEstimatedHours,
                TotalAllocatedHours = totalAllocatedHours,
                OverallProgressPercent = overallProgress,
                StatusDistribution = statusDistribution,
                TopSpecialistsWorkload = topSpecialistsWorkload,
                RecentActivities = recentFollowUps,
                UpcomingMeetings = upcomingMeetings
            };

            return Ok(stats);
        }
    }
}