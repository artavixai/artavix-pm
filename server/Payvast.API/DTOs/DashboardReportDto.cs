using System.Collections.Generic;

namespace Payvast.API.DTOs
{
    public class DashboardReportDto
    {
        // آمار خلاصه
        public int TotalProjects { get; set; }
        public int CriticalProjectsCount { get; set; }
        public int OnTrackProjectsCount { get; set; }
        public double AverageOrganizationDeviation { get; set; }

        // داده‌های نمودارها
        public List<ChartDataDto> OverallProgressChart { get; set; }
        public List<ProjectReportDto> ProjectList { get; set; }
        
        public Dictionary<string, int> ProductGroupDistribution { get; set; }

        // === شروع تغییرات جدید: تحلیل منابع ===
        public List<UserWorkloadDto> ResourceWorkload { get; set; } // بار کاری پرسنل
        // === پایان تغییرات ===
    }
}