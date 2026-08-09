namespace Payvast.API.Models 
{ 
    public class Task 
    { 
        public int Id { get; set; } 
        public int ProjectId { get; set; } 
        public int? ParentTaskId { get; set; } 
        public string Title { get; set; } 
        public string Description { get; set; } 
        public string TaskType { get; set; } 
        public string Status { get; set; } 
        public string Priority { get; set; } 
        public int? Weight { get; set; } 
        public int Progress { get; set; }
        
        public int TotalUnits { get; set; }
        public int CompletedUnits { get; set; }

        public decimal? EstimatedHours { get; set; }
        public decimal? AllocatedHours { get; set; }

        public string PlannedColor { get; set; }
        public string ExecutedColor { get; set; }
        public DateTime StartDate { get; set; } 
        public DateTime? DueDate { get; set; } 
        public decimal? EstimatedEffortHours { get; set; } 
        public int? AssigneeId { get; set; } 
        public DateTime CreatedAt { get; set; } 
        public int CreatedById { get; set; } 
        public int? TaskTemplateId { get; set; }

        // NEW: ارتباط با مرحله چک‌لیست
        public int? ChecklistStepId { get; set; }
        public int DisplayOrder { get; set; }

        public Project Project { get; set; } 
        public Task ParentTask { get; set; } 
        public ICollection<Task> SubTasks { get; set; } = new List<Task>(); 
        public User Assignee { get; set; } 
        public User CreatedBy { get; set; } 
        public TaskTemplate TaskTemplate { get; set; }
        
        // Navigation property
        public ProjectChecklist ChecklistStep { get; set; }
    } 
}