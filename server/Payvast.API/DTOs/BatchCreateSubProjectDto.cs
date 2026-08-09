using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Payvast.API.DTOs
{
    public class BatchCreateSubProjectDto
    {
        [Required]
        public int ParentProjectId { get; set; }

        [Required]
        public List<SubProjectItemDto> SubProjects { get; set; }

        // ===== NEW: کارشناس پیش‌فرض برای تسک‌های ایجاد شده =====
        public int? DefaultAssigneeId { get; set; }
    }

    public class SubProjectItemDto
    {
        [Required]
        public string Title { get; set; }
        
        [Required]
        public string ProductGroup { get; set; }
        
        [Required]
        public int ProjectManagerId { get; set; }

        public string Color { get; set; }
        public List<int> SubsystemIds { get; set; } = new List<int>();
    }
}