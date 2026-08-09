namespace Payvast.API.DTOs
{
    public class DashboardStatsDto
    {
        public int InProgressTasks { get; set; }
        public int TrackableTasks { get; set; } // فعلا ۰ برمی‌گردانیم
        public int ActiveProjects { get; set; }
        public int TodaysTasks { get; set; } // فعلا ۰ برمی‌گردانیم
    }
}