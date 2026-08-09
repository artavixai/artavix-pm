namespace Payvast.API.DTOs
{
    public class UserWorkloadDto
    {
        public string FullName { get; set; }
        public int TotalTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int DoneTasks { get; set; }
        public double EfficiencyScore { get; set; } // نمره بهره‌وری بر اساس تسک‌های انجام شده
    }
}