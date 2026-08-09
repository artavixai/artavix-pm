using System;

namespace Payvast.API.Models
{
    public class WeeklyPlan
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? TaskId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime PlanDate { get; set; }   // UTC
        
        // تغییر به double برای پشتیبانی از 8.5 (08:30)
        public double StartHour { get; set; }
        public double EndHour { get; set; }
        
        public bool IsCompleted { get; set; }
        public string Color { get; set; }
        public DateTime CreatedAt { get; set; }
        public string SourceType { get; set; }
        public int? ExternalId { get; set; }

        // Navigation Properties
        public User User { get; set; }
        public Models.Task Task { get; set; }
    }
}