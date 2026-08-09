using System;

namespace Payvast.API.Models
{
    public class ProjectHourLog
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int ChangedByUserId { get; set; }
        public decimal PreviousEstimatedHours { get; set; }
        public decimal NewEstimatedHours { get; set; }
        public string Reason { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        public Project Project { get; set; }
        public User ChangedByUser { get; set; }
    }
}