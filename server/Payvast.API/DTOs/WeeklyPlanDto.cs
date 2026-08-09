using System;
using System.Collections.Generic;

namespace Payvast.API.DTOs
{
    public class WeeklyPlanDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserFullName { get; set; }
        public string UserAvatarUrl { get; set; }
        public int? TaskId { get; set; }
        public string TaskTitle { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime PlanDate { get; set; }
        public double StartHour { get; set; }
        public double EndHour { get; set; }
        public bool IsCompleted { get; set; }
        public string Color { get; set; }
        public string SourceType { get; set; }
    }

    public class CreatePlanDto
    {
        public int? UserId { get; set; }
        public int? TaskId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime PlanDate { get; set; }
        public double StartHour { get; set; }
        public double EndHour { get; set; }
        public string Color { get; set; }
        public string SourceType { get; set; }
        public int? ExternalId { get; set; }
    }

    public class UpdatePlanDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime PlanDate { get; set; }
        public double StartHour { get; set; }
        public double EndHour { get; set; }
        public bool IsCompleted { get; set; }
        public string Color { get; set; }
    }

    public class CreateWeeklyPlanDto
    {
        public int? UserId { get; set; }
        public int? TaskId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime PlanDate { get; set; }
        public double StartHour { get; set; }
        public double EndHour { get; set; }
        public string Color { get; set; }
        public string SourceType { get; set; }
        public int? ExternalId { get; set; }
    }

    public class UpdateWeeklyPlanDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime PlanDate { get; set; }
        public double StartHour { get; set; }
        public double EndHour { get; set; }
        public bool IsCompleted { get; set; }
        public string Color { get; set; }
    }

    public class TeamScheduleDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string AvatarUrl { get; set; }
        public List<WeeklyPlanDto> Plans { get; set; } = new List<WeeklyPlanDto>();
    }

    public class PlanSuggestionDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime PlanDate { get; set; }
        public double StartHour { get; set; }
        public double EndHour { get; set; }
        public string Color { get; set; }
        public string SourceType { get; set; }
        public int? ExternalId { get; set; }
        public int? UserId { get; set; }
        public string UserFullName { get; set; }
    }
}