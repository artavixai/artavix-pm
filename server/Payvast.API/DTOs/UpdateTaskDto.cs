using System;

namespace Payvast.API.DTOs
{
    public class UpdateTaskDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; }
        public int? AssigneeId { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? StartDate { get; set; }
        public int? ChecklistStepId { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? AllocatedHours { get; set; }
    }
}