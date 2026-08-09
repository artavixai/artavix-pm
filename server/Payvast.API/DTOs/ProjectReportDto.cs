using System;
using System.Collections.Generic;

namespace Payvast.API.DTOs
{
    public class ProjectReportDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string CrmCode { get; set; }
        public string ProjectManager { get; set; }
        public string ProductGroup { get; set; }
        public string Color { get; set; }
        
        public double ActualProgress { get; set; }
        public double PlannedProgress { get; set; }
        public double Deviation { get; set; }
        
        public string Status { get; set; }
        public int RemainingDays { get; set; }

        // === شروع تغییرات: افزودن قابلیت درختی ===
        public List<ProjectReportDto> SubProjects { get; set; } = new List<ProjectReportDto>();
        public bool IsParent { get; set; } // برای تشخیص در فرانت‌اِند
        // === پایان تغییرات ===
    }
}