using System;
using System.Text.Json.Serialization;

namespace Payvast.API.DTOs
{
    public class TaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string Priority { get; set; }
        public int? AssigneeId { get; set; }
        public string AssigneeName { get; set; }
        public DateTime? DueDate { get; set; }
        public int? ChecklistStepId { get; set; }
        public int DisplayOrder { get; set; }
        public string StepName { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? AllocatedHours { get; set; }
        public DateTime? StartDate { get; set; }
    }

    public class GanttTaskDto
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }

        [JsonIgnore]
        public DateTime _StartDate { get; set; }

        [JsonIgnore]
        public DateTime _EndDate { get; set; }

        public int Progress { get; set; }
        public int? Weight { get; set; }
        public int TotalUnits { get; set; }
        public int CompletedUnits { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? AllocatedHours { get; set; }
        public string PlannedColor { get; set; }
        public string ExecutedColor { get; set; }
        public int? SubsystemId { get; set; }
        public string SubsystemName { get; set; }
        public string ProductGroupName { get; set; }
    }

    public class MyTaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string ProjectTitle { get; set; }
    }

    public class ReorderTaskDto
    {
        public string Direction { get; set; }
    }

    public class RebuildStepTasksDto
    {
        public int ChecklistStepId { get; set; }
        public int SessionCount { get; set; }
    }
}