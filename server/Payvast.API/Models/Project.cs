using System;
using System.Collections.Generic;

namespace Payvast.API.Models
{
    public class Project
    {
        public int Id { get; set; }
        public int? ParentProjectId { get; set; }
        public int? Weight { get; set; }
        public string CrmCode { get; set; }
        public string Title { get; set; }
        public string BuyerName { get; set; }
        public int ProjectManagerId { get; set; }
        
        // کارشناس پروژه
        public int? ProjectAssigneeId { get; set; }
        
        public string ProductGroup { get; set; }
        public string SystemType { get; set; }
        public string ProjectStage { get; set; }
        public string Status { get; set; }
        public string CustomStatus { get; set; }
        public string BlockedBy { get; set; }
        public string BlockedReason { get; set; }
        public string Complexity { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int Progress { get; set; }
        public string Credit { get; set; }
        public int? CommittedHours { get; set; }
        public int? PerformedHours { get; set; }
        public string CommittedServices { get; set; }
        public string ProvidedServices { get; set; }
        public string Description { get; set; }
        public string Color { get; set; }
        public DateTime CreatedAt { get; set; }
        public int CreatedById { get; set; }
        public int? LastEditorId { get; set; }

        // NEW: وضعیت تحویل برای زیرپروژه‌های تکمیل شده
        public bool IsDelivered { get; set; } = false;

        // Navigation Properties
        public Project ParentProject { get; set; }
        public ICollection<Project> SubProjects { get; set; } = new List<Project>();
        public User ProjectManager { get; set; }
        public User ProjectAssignee { get; set; }
        public User CreatedBy { get; set; }
        public User LastEditor { get; set; }
        public ICollection<Task> Tasks { get; set; } = new List<Task>();
        public ICollection<ProjectChecklist> Checklists { get; set; } = new List<ProjectChecklist>();
    }
}