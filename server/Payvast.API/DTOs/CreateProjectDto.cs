using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System;

namespace Payvast.API.DTOs
{
    public partial class CreateProjectDto
    {
        public int? ParentProjectId { get; set; }
        public int? Weight { get; set; }
        public string CrmCode { get; set; }
        [Required]
        public string Title { get; set; }
        public string BuyerName { get; set; }
        public int? ProjectManagerId { get; set; }
        
        // ===== NEW =====
        public int? ProjectAssigneeId { get; set; }
        
        public string ProductGroup { get; set; }  // حذف علامت ?
        public string SystemType { get; set; }
        public string ProjectStage { get; set; }
        [Required]
        public string Status { get; set; }
        public string CustomStatus { get; set; }
        public string Complexity { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Credit { get; set; }
        public int? CommittedHours { get; set; }
        public string Description { get; set; }
        public string Color { get; set; }
        public List<int> SubsystemIds { get; set; }
    }
}