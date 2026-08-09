using System;
using System.Collections.Generic;

namespace Payvast.API.DTOs
{
    public class AdvancedReportDto
    {
        public int TotalActiveProjects { get; set; }
        public double TotalDeviationPercent { get; set; }
        public double TeamEfficiencyPercent { get; set; }
        public int TotalDelayDays { get; set; }
        public double GaugeValue { get; set; }
        public List<EstimatedVsAllocatedDto> EstimatedVsAllocated { get; set; }
        public List<WeeklyWorkloadDto> WeeklyWorkload { get; set; }
        public List<ProjectReportTreeNodeDto> ProjectTree { get; set; }
        public List<UserWorkloadShareDto> UserWorkloadShare { get; set; }
        public List<CriticalProjectDto> CriticalProjects { get; set; }
    }

    public class EstimatedVsAllocatedDto
    {
        public string ProjectTitle { get; set; }
        public decimal TotalEstimatedHours { get; set; }
        public decimal TotalAllocatedHours { get; set; }
    }

    public class WeeklyWorkloadDto
    {
        public string WeekStartDate { get; set; }
        public int UserId { get; set; }
        public string UserFullName { get; set; }
        public decimal TotalAllocatedHours { get; set; }
    }

    public class ProjectReportTreeNodeDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int? ParentProjectId { get; set; }
        public decimal TotalEstimatedHours { get; set; }
        public decimal TotalAllocatedHours { get; set; }
        public double ProgressPercent { get; set; }
        public decimal DeviationHours { get; set; }
        public string Status { get; set; }
        public List<ProjectReportTreeNodeDto> Children { get; set; } = new List<ProjectReportTreeNodeDto>();
    }

    public class UserWorkloadShareDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public decimal TotalAllocatedHours { get; set; }
    }

    public class CriticalProjectDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public decimal DeviationHours { get; set; }
        public double DeviationPercent { get; set; }
        public string Status { get; set; }
    }

    public class WeeklyWorkloadResponseDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string AvatarUrl { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal AllocatedHours { get; set; }
        public double Efficiency { get; set; }
    }
}