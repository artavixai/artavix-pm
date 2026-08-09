using System;

namespace Payvast.API.Models
{
    public class ProjectStepTemplate
    {
        public int Id { get; set; }
        public int ProductGroupId { get; set; }
        public string StepName { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ProductGroup ProductGroup { get; set; }
    }
}