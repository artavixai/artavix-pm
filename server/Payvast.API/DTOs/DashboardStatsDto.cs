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

        // نمودار ۲ چندبعدی: به‌کارگیری نیروها با آواتار و تفکیک ماه‌های مختلف
        public List<SpecialistMultiMonthWorkloadDto> SpecialistMonthlyWorkloads { get; set; } = new List<SpecialistMultiMonthWorkloadDto>();

        // نمودار ۳: روند ۶ ماهه ساعات برآورد و اقدام
        public List<MonthlyTrendDto> MonthlyHoursTrend { get; set; } = new List<MonthlyTrendDto>();

        // ماتریس پروژه‌های فعال برتر
        public List<ProjectMatrixDto> TopActiveProjects { get; set; } = new List<ProjectMatrixDto>();

        // ویجت ۱: جریان ترکیبی آخرین فعالیت‌ها و اقدامات CRM
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

    public class SpecialistMultiMonthWorkloadDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string AvatarUrl { get; set; }
        public string JobTitle { get; set; }
        public int DailyCapacityHours { get; set; }
        public int MonthlyCapacityHours { get; set; }
        public List<MonthlyWorkloadItemDto> MonthlyData { get; set; } = new List<MonthlyWorkloadItemDto>();
    }

    public class MonthlyWorkloadItemDto
    {
        public string MonthKey { get; set; }    // e.g. "2026-08"
        public string MonthName { get; set; }   // e.g. "Aug 2026" or "مرداد"
        public decimal EstimatedHours { get; set; }
        public decimal AllocatedHours { get; set; }
        public double UtilizationPercent { get; set; }
    }

    public class MonthlyTrendDto
    {
        public string MonthName { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal AllocatedHours { get; set; }
    }

    public class ProjectMatrixDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string CrmCode { get; set; }
        public int Progress { get; set; }
        public string Status { get; set; }
        public string Color { get; set; }
        public string ManagerName { get; set; }
        public string ManagerAvatar { get; set; }
        public string AssigneeName { get; set; }
        public string AssigneeAvatar { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal AllocatedHours { get; set; }
        public int SubProjectsCount { get; set; }
    }

    public class RecentActivityDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string ProjectTitle { get; set; }
        public string Content { get; set; }
        public string UserFullName { get; set; }
        public string UserAvatarUrl { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } // "FollowUp" or "CrmAction"
        public bool IsResolved { get; set; }
        public string Duration { get; set; }
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