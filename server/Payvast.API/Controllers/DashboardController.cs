using System;
using System.Collections.Generic;
using System.Globalization;
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

            // ۳. پروژه‌ها
            var allProjects = await _context.Projects
                .Include(p => p.ProjectManager)
                .Include(p => p.ProjectAssignee)
                .Include(p => p.SubProjects)
                .Include(p => p.Tasks)
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

            // ۴. تسک‌های گانت
            var allGanttTasks = await _context.Tasks
                .Where(t => t.TaskType == "GANTT")
                .Include(t => t.Assignee)
                .AsNoTracking()
                .ToListAsync();

            decimal totalEstimatedHours = allGanttTasks.Sum(t => t.EstimatedHours ?? 0);
            decimal totalAllocatedHours = allGanttTasks.Sum(t => t.AllocatedHours ?? 0);

            // ۵. نمودار ۱: توزیع وضعیت پروژه‌ها
            var statusDistribution = new List<ProjectStatusDistributionDto>
            {
                new ProjectStatusDistributionDto { Name = "In Progress", Value = activeProjectsCount, Color = "#3b82f6" },
                new ProjectStatusDistributionDto { Name = "Completed", Value = completedProjectsCount, Color = "#10b981" },
                new ProjectStatusDistributionDto { Name = "Planned", Value = allProjects.Count(p => p.Status == "Planned" || p.Status == "برنامه‌ریزی شده"), Color = "#f59e0b" },
                new ProjectStatusDistributionDto { Name = "Suspended", Value = allProjects.Count(p => p.Status == "Suspended" || p.Status == "معلق"), Color = "#64748b" },
                new ProjectStatusDistributionDto { Name = "Critical", Value = criticalProjectsCount, Color = "#ef4444" }
            }.Where(x => x.Value > 0).ToList();

            // ۶. چندبعدی: تحلیل کارشناسان با عکس و کارکرد در ۴ ماه اخیر/آتی
            var activeUsers = await _context.Users
                .Where(u => u.IsActive)
                .AsNoTracking()
                .ToListAsync();

            var monthsToAnalyze = new List<DateTime>();
            for (int i = -2; i <= 1; i++)
            {
                monthsToAnalyze.Add(now.AddMonths(i));
            }

            var specialistMonthlyWorkloads = new List<SpecialistMultiMonthWorkloadDto>();

            foreach (var user in activeUsers)
            {
                var userTasks = allGanttTasks.Where(t => t.AssigneeId == user.Id).ToList();

                var monthlyData = new List<MonthlyWorkloadItemDto>();
                foreach (var mDate in monthsToAnalyze)
                {
                    var tasksInMonth = userTasks.Where(t => t.StartDate.Year == mDate.Year && t.StartDate.Month == mDate.Month).ToList();
                    decimal est = tasksInMonth.Sum(t => t.EstimatedHours ?? 0);
                    decimal alloc = tasksInMonth.Sum(t => t.AllocatedHours ?? 0);
                    double cap = user.MonthlyCapacityHours > 0 ? user.MonthlyCapacityHours : 198;
                    double util = Math.Round((double)alloc / cap * 100, 1);

                    monthlyData.Add(new MonthlyWorkloadItemDto
                    {
                        MonthKey = mDate.ToString("yyyy-MM"),
                        MonthName = mDate.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                        EstimatedHours = est,
                        AllocatedHours = alloc,
                        UtilizationPercent = util
                    });
                }

                specialistMonthlyWorkloads.Add(new SpecialistMultiMonthWorkloadDto
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    JobTitle = user.JobTitle ?? "Specialist",
                    DailyCapacityHours = user.DailyCapacityHours,
                    MonthlyCapacityHours = user.MonthlyCapacityHours,
                    MonthlyData = monthlyData
                });
            }

            // ۷. نمودار ترکیبی روند ۶ ماهه ساعات
            var monthlyHoursTrend = new List<MonthlyTrendDto>();
            for (int i = 5; i >= 0; i--)
            {
                var mDate = now.AddMonths(-i);
                var tasksInMonth = allGanttTasks.Where(t => t.StartDate.Year == mDate.Year && t.StartDate.Month == mDate.Month).ToList();
                monthlyHoursTrend.Add(new MonthlyTrendDto
                {
                    MonthName = mDate.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                    EstimatedHours = tasksInMonth.Sum(t => t.EstimatedHours ?? 0),
                    AllocatedHours = tasksInMonth.Sum(t => t.AllocatedHours ?? 0)
                });
            }

            // ۸. ماتریس پروژه‌های فعال برتر
            var topActiveProjects = allProjects
                .Where(p => p.ParentProjectId == null)
                .OrderByDescending(p => p.SubProjects.Count)
                .ThenByDescending(p => p.Progress)
                .Take(4)
                .Select(p => new ProjectMatrixDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    CrmCode = p.CrmCode,
                    Progress = p.Progress,
                    Status = p.Status,
                    Color = p.Color ?? "#3b82f6",
                    ManagerName = p.ProjectManager?.FullName ?? "N/A",
                    ManagerAvatar = p.ProjectManager?.AvatarUrl,
                    AssigneeName = p.ProjectAssignee?.FullName ?? "Unassigned",
                    AssigneeAvatar = p.ProjectAssignee?.AvatarUrl,
                    EstimatedHours = p.Tasks.Where(t => t.TaskType == "GANTT").Sum(t => t.EstimatedHours ?? 0),
                    AllocatedHours = p.Tasks.Where(t => t.TaskType == "GANTT").Sum(t => t.AllocatedHours ?? 0),
                    SubProjectsCount = p.SubProjects.Count
                })
                .ToList();

            // ۹. ویجت جامع فعالیت‌های زنده سیستم (پیگیری‌ها + CRM + تسک‌ها + یادداشت‌ها)
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
                    UserAvatarUrl = f.User != null ? f.User.AvatarUrl : null,
                    Date = f.FollowUpDate,
                    Type = "FollowUp",
                    IsResolved = f.IsResolved,
                    Duration = null
                })
                .ToListAsync();

            var recentCrmActions = await _context.CrmActions
                .Include(a => a.Project)
                .OrderByDescending(a => a.ActionDate)
                .Take(5)
                .AsNoTracking()
                .Select(a => new RecentActivityDto
                {
                    Id = a.Id,
                    ProjectId = a.ProjectId,
                    ProjectTitle = a.Project != null ? a.Project.Title : "CRM Project",
                    Content = a.Description,
                    UserFullName = a.CrmUser ?? "CRM Specialist",
                    UserAvatarUrl = null,
                    Date = a.ActionDate,
                    Type = "CrmAction",
                    IsResolved = true,
                    Duration = a.Duration
                })
                .ToListAsync();

            var recentTasks = await _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.Assignee)
                .OrderByDescending(t => t.CreatedAt)
                .Take(5)
                .AsNoTracking()
                .Select(t => new RecentActivityDto
                {
                    Id = t.Id,
                    ProjectId = t.ProjectId,
                    ProjectTitle = t.Project != null ? t.Project.Title : "Project Task",
                    Content = $"Task: {t.Title} ({t.Status})",
                    UserFullName = t.Assignee != null ? t.Assignee.FullName : "System Task",
                    UserAvatarUrl = t.Assignee != null ? t.Assignee.AvatarUrl : null,
                    Date = t.CreatedAt,
                    Type = "TaskActivity",
                    IsResolved = t.Status == "Done",
                    Duration = t.EstimatedHours.HasValue ? $"{t.EstimatedHours}h" : null
                })
                .ToListAsync();

            var recentNotes = await _context.Notes
                .Include(n => n.User)
                .OrderByDescending(n => n.UpdatedAt)
                .Take(5)
                .AsNoTracking()
                .Select(n => new RecentActivityDto
                {
                    Id = n.Id,
                    ProjectId = 0,
                    ProjectTitle = $"Note: {n.Category}",
                    Content = n.Title,
                    UserFullName = n.User != null ? n.User.FullName : "User",
                    UserAvatarUrl = n.User != null ? n.User.AvatarUrl : null,
                    Date = n.UpdatedAt,
                    Type = "Note",
                    IsResolved = true,
                    Duration = null
                })
                .ToListAsync();

            var recentActivities = recentFollowUps
                .Concat(recentCrmActions)
                .Concat(recentTasks)
                .Concat(recentNotes)
                .OrderByDescending(a => a.Date)
                .Take(6)
                .ToList();

            // ۱۰. جلسات پیش‌رو
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
                SpecialistMonthlyWorkloads = specialistMonthlyWorkloads,
                MonthlyHoursTrend = monthlyHoursTrend,
                TopActiveProjects = topActiveProjects,
                RecentActivities = recentActivities,
                UpcomingMeetings = upcomingMeetings
            };

            return Ok(stats);
        }
    }
}