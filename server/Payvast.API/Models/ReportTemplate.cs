using System.Collections.Generic;

namespace Payvast.API.Models
{
    public class ReportTemplate
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public bool IsActive { get; set; } = true;
        public System.DateTime CreatedAt { get; set; } = System.DateTime.UtcNow;
        public int DefaultSessionsCount { get; set; } // جمع جلسات تمام مراحل

        public ICollection<ReportStepTemplate> Steps { get; set; } = new List<ReportStepTemplate>();
        public ICollection<ProjectReport> ProjectReports { get; set; } = new List<ProjectReport>();
    }
}