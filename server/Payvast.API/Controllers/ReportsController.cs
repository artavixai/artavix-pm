using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Globalization;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard-report")]
        public async Task<ActionResult<DashboardReportDto>> GetDashboardReport()
        {
            var now = DateTime.UtcNow;

            var allProjects = await _context.Projects
                .Include(p => p.ProjectManager)
                .AsNoTracking()
                .ToListAsync();

            var allReports = allProjects.Select(p => {
                double plannedProgress = 0;
                if (p.Status != "Planned" && p.Status != "Suspended")
                {
                    plannedProgress = CalculatePlannedProgress(p.StartDate, p.EndDate, now);
                }

                double actualProgress = p.Progress;
                double deviation = actualProgress - plannedProgress;
                if (actualProgress >= 100) deviation = 0;

                int remainingDays = 0;
                if (p.EndDate.HasValue && p.EndDate.Value > now)
                    remainingDays = (int)(p.EndDate.Value - now).TotalDays;

                return new ProjectReportDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    CrmCode = p.CrmCode,
                    ProjectManager = p.ProjectManager?.FullName ?? "Unassigned",
                    ProductGroup = p.ProductGroup ?? "General",
                    Color = p.Color ?? "#3b82f6",
                    ActualProgress = Math.Round(actualProgress, 1),
                    PlannedProgress = Math.Round(plannedProgress, 1),
                    Deviation = Math.Round(deviation, 1),
                    Status = GetStatusByDeviation(deviation, p.EndDate, now, p.Status, actualProgress),
                    RemainingDays = remainingDays,
                    IsParent = false,
                    SubProjects = new List<ProjectReportDto>()
                };
            }).ToDictionary(x => x.Id);

            var rootReports = new List<ProjectReportDto>();
            foreach (var p in allProjects)
            {
                if (p.ParentProjectId.HasValue && allReports.ContainsKey(p.ParentProjectId.Value))
                {
                    allReports[p.ParentProjectId.Value].SubProjects.Add(allReports[p.Id]);
                    allReports[p.ParentProjectId.Value].IsParent = true;
                }
                else
                {
                    rootReports.Add(allReports[p.Id]);
                }
            }

            var reportSummary = new DashboardReportDto
            {
                TotalProjects = allProjects.Count,
                CriticalProjectsCount = allReports.Values.Count(x => x.Status == "Critical"),
                OnTrackProjectsCount = allReports.Values.Count(x => x.Status == "On Track" || x.Status == "Completed"),
                AverageOrganizationDeviation = allReports.Values.Any() ? Math.Round(allReports.Values.Average(x => x.Deviation), 2) : 0,
                ProjectList = rootReports.OrderByDescending(x => x.IsParent).ThenBy(x => x.Deviation).ToList(),
                ProductGroupDistribution = allReports.Values.GroupBy(x => x.ProductGroup).ToDictionary(g => g.Key, g => g.Count()),
                ResourceWorkload = await GetWorkloadData(),
                OverallProgressChart = allReports.Values.OrderBy(x => x.Deviation).Select(r => new ChartDataDto {
                    Label = r.Title, ActualProgress = r.ActualProgress, PlannedProgress = r.PlannedProgress
                }).Take(10).ToList()
            };

            return Ok(reportSummary);
        }

        [HttpGet("advanced-report")]
        public async Task<ActionResult<AdvancedReportDto>> GetAdvancedReport()
        {
            var now = DateTime.UtcNow;

            var allProjects = await _context.Projects
                .Include(p => p.SubProjects)
                .ThenInclude(sp => sp.SubProjects)
                .Include(p => p.Tasks)
                .AsNoTracking()
                .ToListAsync();

            var projectTree = new List<ProjectReportTreeNodeDto>();
            foreach (var p in allProjects.Where(p => p.ParentProjectId == null))
            {
                projectTree.Add(await BuildProjectTreeNode(p, now));
            }

            var projectStats = new Dictionary<int, (decimal Estimated, decimal Allocated)>();
            foreach (var p in allProjects)
            {
                projectStats[p.Id] = await GetProjectHoursRecursive(p.Id);
            }

            var projectTimelines = new Dictionary<int, (DateTime? EarliestStart, DateTime? LatestEnd, int TotalTasks, int CompletedTasks)>();
            foreach (var p in allProjects)
            {
                var timeline = await GetProjectTimelineRecursive(p.Id);
                projectTimelines[p.Id] = timeline;
            }

            int activeProjects = allProjects.Count(p => p.Status != "Completed");
            decimal totalEstimatedAll = projectStats.Sum(x => x.Value.Estimated);
            decimal totalAllocatedAll = projectStats.Sum(x => x.Value.Allocated);
            double totalDeviationPercent = totalEstimatedAll > 0
                ? Math.Round((double)(totalAllocatedAll - totalEstimatedAll) / (double)totalEstimatedAll * 100, 1)
                : 0;
            double teamEfficiency = totalEstimatedAll > 0
                ? Math.Round((double)totalAllocatedAll / (double)totalEstimatedAll * 100, 1)
                : 0;

            int totalDelayDays = 0;
            foreach (var p in allProjects.Where(p => p.Status != "Completed"))
            {
                if (p.EndDate.HasValue && p.EndDate.Value < now)
                {
                    totalDelayDays += (int)(now - p.EndDate.Value).TotalDays;
                }
            }

            var estimatedVsAllocated = projectStats
                .Select(x => new EstimatedVsAllocatedDto
                {
                    ProjectTitle = allProjects.First(p => p.Id == x.Key).Title,
                    TotalEstimatedHours = x.Value.Estimated,
                    TotalAllocatedHours = x.Value.Allocated
                })
                .OrderByDescending(x => x.TotalEstimatedHours)
                .Take(5)
                .ToList();

            var weeks = GetLastWeeks(12);
            var allTasksWithDates = await _context.Tasks
                .Where(t => t.TaskType == "GANTT" && t.AllocatedHours > 0)
                .Include(t => t.Assignee)
                .AsNoTracking()
                .ToListAsync();

            var weeklyWorkload = new List<WeeklyWorkloadDto>();
            foreach (var week in weeks)
            {
                var weekStart = week;
                var weekEnd = week.AddDays(7);
                var tasksInWeek = allTasksWithDates
                    .Where(t => t.StartDate >= weekStart && t.StartDate < weekEnd)
                    .GroupBy(t => t.AssigneeId)
                    .Select(g => new WeeklyWorkloadDto
                    {
                        WeekStartDate = weekStart.ToString("yyyy/MM/dd"),
                        UserId = g.Key ?? 0,
                        UserFullName = g.First().Assignee?.FullName ?? "Unassigned",
                        TotalAllocatedHours = g.Sum(x => x.AllocatedHours ?? 0)
                    })
                    .ToList();
                weeklyWorkload.AddRange(tasksInWeek);
            }

            // SQLite In-Memory Grouping Fix
            var allGanttTasksWithUsers = await _context.Tasks
                .Where(t => t.TaskType == "GANTT" && t.AssigneeId.HasValue && t.AllocatedHours > 0)
                .Include(t => t.Assignee)
                .AsNoTracking()
                .ToListAsync();

            var userWorkloadShare = allGanttTasksWithUsers
                .GroupBy(t => t.AssigneeId)
                .Select(g => new UserWorkloadShareDto
                {
                    UserId = g.Key.Value,
                    FullName = g.First().Assignee.FullName,
                    TotalAllocatedHours = g.Sum(x => x.AllocatedHours ?? 0)
                })
                .OrderByDescending(x => x.TotalAllocatedHours)
                .ToList();

            var criticalProjects = new List<CriticalProjectDto>();
            foreach (var p in allProjects.Where(p => p.ParentProjectId == null))
            {
                var stats = projectStats[p.Id];
                var timeline = projectTimelines[p.Id];
                decimal estimated = stats.Estimated;
                decimal allocated = stats.Allocated;
                double deviationPercent = estimated > 0
                    ? Math.Round((double)(allocated - estimated) / (double)estimated * 100, 1)
                    : 0;

                bool isCritical = false;
                if (timeline.EarliestStart.HasValue && timeline.LatestEnd.HasValue && timeline.LatestEnd.Value > timeline.EarliestStart.Value)
                {
                    var totalDuration = (timeline.LatestEnd.Value - timeline.EarliestStart.Value).TotalDays;
                    var elapsed = (now - timeline.EarliestStart.Value).TotalDays;
                    if (elapsed < 0) elapsed = 0;
                    double expectedProgressPercent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
                    double actualProgressPercent = estimated > 0 ? (double)allocated / (double)estimated * 100 : 0;
                    double scheduleDeviation = actualProgressPercent - expectedProgressPercent;

                    if (actualProgressPercent < 20 && expectedProgressPercent > 50) isCritical = true;
                    if (scheduleDeviation < -15) isCritical = true;
                    if (deviationPercent < -25 && expectedProgressPercent > 30) isCritical = true;
                }
                else
                {
                    if (deviationPercent < -15) isCritical = true;
                }

                criticalProjects.Add(new CriticalProjectDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    DeviationHours = allocated - estimated,
                    DeviationPercent = deviationPercent,
                    Status = isCritical ? "Critical" : (deviationPercent < -5 ? "Warning" : "Normal")
                });
            }

            criticalProjects = criticalProjects
                .OrderByDescending(x => Math.Abs(x.DeviationHours))
                .Take(5)
                .ToList();

            var result = new AdvancedReportDto
            {
                TotalActiveProjects = activeProjects,
                TotalDeviationPercent = totalDeviationPercent,
                TeamEfficiencyPercent = teamEfficiency,
                TotalDelayDays = totalDelayDays,
                GaugeValue = totalDeviationPercent,
                EstimatedVsAllocated = estimatedVsAllocated,
                WeeklyWorkload = weeklyWorkload,
                ProjectTree = projectTree,
                UserWorkloadShare = userWorkloadShare,
                CriticalProjects = criticalProjects
            };

            return Ok(result);
        }

        [HttpGet("weekly-workload")]
        public async Task<ActionResult<IEnumerable<WeeklyWorkloadResponseDto>>> GetWeeklyWorkload([FromQuery] string weekStartDate)
        {
            try
            {
                if (!Regex.IsMatch(weekStartDate, @"^\d{4}/\d{2}/\d{2}$"))
                    return BadRequest("Invalid date format. Expected: YYYY/MM/DD");

                var parts = weekStartDate.Split('/');
                int year = int.Parse(parts[0]);
                int month = int.Parse(parts[1]);
                int day = int.Parse(parts[2]);
                var startDate = new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);
                var endDate = startDate.AddDays(7);

                var users = await _context.Users
                    .Where(u => u.IsActive)
                    .Select(u => new { u.Id, u.FullName, u.AvatarUrl })
                    .ToListAsync();

                var tasksInWeek = await _context.Tasks
                    .Where(t => t.TaskType == "GANTT" && t.StartDate >= startDate && t.StartDate < endDate && t.AssigneeId.HasValue)
                    .AsNoTracking()
                    .ToListAsync();

                var groupedTasks = tasksInWeek
                    .GroupBy(t => t.AssigneeId)
                    .Select(g => new
                    {
                        UserId = g.Key.Value,
                        TotalEstimated = g.Sum(t => t.EstimatedHours ?? 0),
                        TotalAllocated = g.Sum(t => t.AllocatedHours ?? 0)
                    }).ToList();

                var result = new List<WeeklyWorkloadResponseDto>();
                foreach (var user in users)
                {
                    var userTasks = groupedTasks.FirstOrDefault(t => t.UserId == user.Id);
                    decimal estimated = userTasks?.TotalEstimated ?? 0;
                    decimal allocated = userTasks?.TotalAllocated ?? 0;
                    if (estimated == 0 && allocated == 0) continue;
                    double efficiency = estimated > 0 ? Math.Round((double)allocated / (double)estimated * 100, 1) : 0;

                    result.Add(new WeeklyWorkloadResponseDto
                    {
                        UserId = user.Id,
                        FullName = user.FullName,
                        AvatarUrl = user.AvatarUrl,
                        EstimatedHours = estimated,
                        AllocatedHours = allocated,
                        Efficiency = efficiency
                    });
                }
                return Ok(result.OrderByDescending(r => r.AllocatedHours));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching weekly data: {ex.Message}");
            }
        }

        private async Task<ProjectReportTreeNodeDto> BuildProjectTreeNode(Project p, DateTime now)
        {
            var hours = await GetProjectHoursRecursive(p.Id);
            double progress = hours.Estimated > 0
                ? Math.Round((double)hours.Allocated / (double)hours.Estimated * 100, 1)
                : 0;

            string status = "Normal";
            var timeline = await GetProjectTimelineRecursive(p.Id);
            if (timeline.EarliestStart.HasValue && timeline.LatestEnd.HasValue)
            {
                var totalDuration = (timeline.LatestEnd.Value - timeline.EarliestStart.Value).TotalDays;
                var elapsed = (now - timeline.EarliestStart.Value).TotalDays;
                if (elapsed < 0) elapsed = 0;
                double expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
                double deviationTime = progress - expectedProgress;
                if (deviationTime < -15) status = "Critical";
                else if (deviationTime < -5) status = "Warning";
            }
            else
            {
                double deviationPercent = hours.Estimated > 0
                    ? (double)(hours.Allocated - hours.Estimated) / (double)hours.Estimated * 100
                    : 0;
                if (deviationPercent < -15) status = "Critical";
                else if (deviationPercent < -5) status = "Warning";
            }

            var node = new ProjectReportTreeNodeDto
            {
                Id = p.Id,
                Title = p.Title,
                ParentProjectId = p.ParentProjectId,
                TotalEstimatedHours = hours.Estimated,
                TotalAllocatedHours = hours.Allocated,
                ProgressPercent = progress,
                DeviationHours = hours.Allocated - hours.Estimated,
                Status = status,
                Children = new List<ProjectReportTreeNodeDto>()
            };

            var children = await _context.Projects
                .Where(sp => sp.ParentProjectId == p.Id)
                .ToListAsync();

            foreach (var child in children)
            {
                node.Children.Add(await BuildProjectTreeNode(child, now));
            }

            return node;
        }

        private async Task<(decimal Estimated, decimal Allocated)> GetProjectHoursRecursive(int projectId)
        {
            var directTasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId && t.TaskType == "GANTT")
                .ToListAsync();

            decimal estimated = directTasks.Sum(t => t.EstimatedHours ?? 0);
            decimal allocated = directTasks.Sum(t => t.AllocatedHours ?? 0);

            var subProjects = await _context.Projects
                .Where(sp => sp.ParentProjectId == projectId)
                .ToListAsync();

            foreach (var sub in subProjects)
            {
                var subHours = await GetProjectHoursRecursive(sub.Id);
                estimated += subHours.Estimated;
                allocated += subHours.Allocated;
            }

            return (estimated, allocated);
        }

        private async Task<(DateTime? EarliestStart, DateTime? LatestEnd, int TotalTasks, int CompletedTasks)> GetProjectTimelineRecursive(int projectId)
        {
            var tasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId && t.TaskType == "GANTT")
                .ToListAsync();

            DateTime? earliest = tasks.Any() ? tasks.Min(t => t.StartDate) : null;
            DateTime? latest = tasks.Any() ? tasks.Max(t => t.DueDate) : null;
            int totalTasks = tasks.Count;
            int completedTasks = tasks.Count(t => t.Status == "Done");

            var subProjects = await _context.Projects
                .Where(sp => sp.ParentProjectId == projectId)
                .ToListAsync();

            foreach (var sub in subProjects)
            {
                var subTimeline = await GetProjectTimelineRecursive(sub.Id);
                if (subTimeline.EarliestStart.HasValue && (!earliest.HasValue || subTimeline.EarliestStart < earliest))
                    earliest = subTimeline.EarliestStart;
                if (subTimeline.LatestEnd.HasValue && (!latest.HasValue || subTimeline.LatestEnd > latest))
                    latest = subTimeline.LatestEnd;
                totalTasks += subTimeline.TotalTasks;
                completedTasks += subTimeline.CompletedTasks;
            }

            return (earliest, latest, totalTasks, completedTasks);
        }

        private List<DateTime> GetLastWeeks(int count)
        {
            var now = DateTime.UtcNow;
            var weeks = new List<DateTime>();
            for (int i = count - 1; i >= 0; i--)
            {
                var startOfWeek = now.AddDays(-7 * i).Date;
                while (startOfWeek.DayOfWeek != DayOfWeek.Sunday)
                {
                    startOfWeek = startOfWeek.AddDays(-1);
                }
                weeks.Add(startOfWeek);
            }
            return weeks;
        }

        private async Task<List<UserWorkloadDto>> GetWorkloadData()
        {
            var users = await _context.Users.Where(u => u.IsActive).AsNoTracking().ToListAsync();
            var allTasks = await _context.Tasks.AsNoTracking().ToListAsync();

            return users.Select(u => {
                var userTasks = allTasks.Where(t => t.AssigneeId == u.Id).ToList();
                int total = userTasks.Count;
                int done = userTasks.Count(t => t.Status == "Done");
                return new UserWorkloadDto
                {
                    FullName = u.FullName,
                    TotalTasks = total,
                    InProgressTasks = userTasks.Count(t => t.Status == "InProgress"),
                    DoneTasks = done,
                    EfficiencyScore = total > 0 ? Math.Round((double)done / total * 100, 1) : 0
                };
            }).Where(w => w.TotalTasks > 0).OrderByDescending(w => w.TotalTasks).ToList();
        }

        private double CalculatePlannedProgress(DateTime? start, DateTime? end, DateTime now)
        {
            if (!start.HasValue || !end.HasValue) return 0;
            if (now < start.Value) return 0;
            if (now > end.Value) return 100;
            double totalDuration = (end.Value - start.Value).TotalDays;
            double elapsed = (now - start.Value).TotalDays;
            return totalDuration <= 0 ? 100 : (elapsed / totalDuration) * 100;
        }

        private string GetStatusByDeviation(double deviation, DateTime? end, DateTime now, string currentStatus, double actualProgress)
        {
            if (actualProgress >= 100 || currentStatus == "Completed") return "Completed";
            if (currentStatus == "Planned") return "Planned";
            if (currentStatus == "Suspended") return "Suspended";

            if (end.HasValue && now > end.Value && actualProgress < 100) return "Critical";
            if (deviation < -15) return "Critical";
            if (deviation < -5) return "Delayed";
            return "On Track";
        }

        [HttpGet("project-status-report")]
        public async Task<ActionResult<IEnumerable<ProjectStatusReportDto>>> GetProjectStatusReport()
        {
            var projects = await _context.Projects
                .Include(p => p.ProjectManager)
                .Include(p => p.Tasks)
                .Where(p => p.ParentProjectId == null)
                .AsNoTracking()
                .ToListAsync();

            var result = new List<ProjectStatusReportDto>();
            foreach (var proj in projects)
            {
                var allTasksForProject = await GetAllTasksRecursive(proj.Id);
                var ganttTasks = allTasksForProject.Where(t => t.TaskType == "GANTT").ToList();

                decimal totalEstimated = ganttTasks.Sum(t => t.EstimatedHours ?? 0);
                decimal totalAllocated = ganttTasks.Sum(t => t.AllocatedHours ?? 0);
                decimal totalRemaining = totalEstimated - totalAllocated;
                if (totalRemaining < 0) totalRemaining = 0;

                result.Add(new ProjectStatusReportDto
                {
                    Id = proj.Id,
                    Title = proj.Title,
                    StartDate = proj.StartDate,
                    EstimatedEndDate = proj.EndDate,
                    TotalEstimatedHours = totalEstimated,
                    TotalAllocatedHours = totalAllocated,
                    TotalRemainingHours = totalRemaining,
                    Progress = proj.Progress,
                    Status = proj.Status,
                    ProjectManagerName = proj.ProjectManager?.FullName ?? "Unassigned",
                    CustomStatus = proj.CustomStatus,
                    BlockedBy = proj.BlockedBy,
                    BlockedReason = proj.BlockedReason
                });
            }

            return Ok(result);
        }

        private async Task<List<Models.Task>> GetAllTasksRecursive(int projectId)
        {
            var tasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId)
                .ToListAsync();

            var subProjects = await _context.Projects
                .Where(p => p.ParentProjectId == projectId)
                .ToListAsync();

            foreach (var sub in subProjects)
            {
                tasks.AddRange(await GetAllTasksRecursive(sub.Id));
            }

            return tasks;
        }
    }
}