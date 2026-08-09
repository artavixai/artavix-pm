using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Payvast.API.DTOs
{
    public class ProjectCardDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string CrmCode { get; set; }
        public string Status { get; set; }
        public string CustomStatus { get; set; }
        public int Progress { get; set; }
        public int? Weight { get; set; }
        public string ProductGroup { get; set; }
        public string Color { get; set; }
        
        public int? ProjectAssigneeId { get; set; }
        public string ProjectAssigneeName { get; set; }
        public string ProjectAssigneeAvatarUrl { get; set; }
        
        // NEW
        public bool IsDelivered { get; set; } = false;
        
        public List<SubProjectTagDto> SubProjects { get; set; } = new List<SubProjectTagDto>();
        [JsonIgnore]
        public int? _ParentProjectId { get; set; }
    }
}