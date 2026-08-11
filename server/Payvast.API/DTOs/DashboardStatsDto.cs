using System;
using System.Collections.Generic;

namespace Payvast.API.DTOs
{
    public class DashboardStatsDto
    {
        // شاخص‌های کلیدی عددی (KPI Metrics)
        public int InProgressTasks { get; set; }
        public int TrackableTasks { get; set; }
        public int ActiveProjects { get; set; }
        public int TodaysTasks { get; set; }
        public int CriticalProjectsCount { get; set; }
        public int CompletedProjectsCount { get; set; }
        public decimal TotalEstimatedHours { get; set; }
        public decimal TotalAllocatedHours { get; set; }
        public double OverallProgressPercent { get; set; }

        // نمودار ۱: توزیع وضعیت پروژه‌ها
        public List<ProjectStatusDistributionDto> StatusDistribution { get; set; } = new List<ProjectStatusDistributionDto>();

        // نمودار ۲: بار کاری کارشناسان برتر
        public List<SpecialistWorkloadDto> TopSpecialistsWorkload { get; set; } = new List<SpecialistWorkloadDto>();

        // ویجت ۱: جریان آخرین فعالیت‌ها و پیگیری‌ها
        public List<RecentActivityDto> RecentActivities { get; set; } = new List<RecentActivityDto>();

        // ویجت ۲: جلسات پیش‌رو
        public List<UpcomingMeetingDto> UpcomingMeetings { get; set; } = new List<UpcomingMeetingDto>();
    }

    public class ProjectStatusDistributionDto
    {
        public string Name { get; set; }
        public int Value { get; set; }
        public string Color { get; set; }
    }

    public class SpecialistWorkloadDto
    {
        public string FullName { get; set; }
        public string AvatarUrl { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal AllocatedHours { get; set; }
    }

    public class RecentActivityDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string ProjectTitle { get; set; }
        public string Content { get; set; }
        public string UserFullName { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } // "FollowUp" or "CrmAction"
        public bool IsResolved { get; set; }
    }

    public class UpcomingMeetingDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string ProjectTitle { get; set; }
        public string Color { get; set; }
    }
}