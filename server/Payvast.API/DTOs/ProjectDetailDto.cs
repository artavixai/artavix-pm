using System;
using System.Collections.Generic;

namespace Payvast.API.DTOs
{
    public class ProjectDetailDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string CrmCode { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string CustomStatus { get; set; }
        public string BlockedBy { get; set; }
        public string BlockedReason { get; set; }
        public int CalculatedProgress { get; set; }
        public string BuyerName { get; set; }
        public string ProjectManagerName { get; set; }
        
        // ===== NEW =====
        public int? ProjectAssigneeId { get; set; }
        public string ProjectAssigneeName { get; set; }
        
        public string ProductGroup { get; set; }
        public string ProjectStage { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Credit { get; set; }
        public int? CommittedHours { get; set; }
        public string CreatorName { get; set; }
        public int? ParentProjectId { get; set; }

        public List<ProjectCardDto> SubProjects { get; set; } = new List<ProjectCardDto>();
        public List<ProjectChecklistDto> Checklists { get; set; } = new List<ProjectChecklistDto>();
    }
}