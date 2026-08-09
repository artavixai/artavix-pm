using System.ComponentModel.DataAnnotations;

namespace Payvast.API.DTOs
{
    public class CreateOrUpdateGanttTaskDto
    {
        [Required]
        public string Title { get; set; }
        [Required]
        public string StartDate { get; set; }
        [Required]
        public string EndDate { get; set; }
        public int? Weight { get; set; }
        public int TotalUnits { get; set; }
        public int CompletedUnits { get; set; }
        public decimal? EstimatedHours { get; set; }   // NEW
        public decimal? AllocatedHours { get; set; }   // NEW
        public string PlannedColor { get; set; }
        public string ExecutedColor { get; set; }
    }
}