using System.ComponentModel.DataAnnotations;

namespace Payvast.API.DTOs
{
    public class CreateTaskDto
    {
        [Required]
        public string Title { get; set; }
        public string Description { get; set; }
        [Required]
        public string Priority { get; set; }
        public int? AssigneeId { get; set; }
        public DateTime? DueDate { get; set; }
        
        // NEW: مرحله چک‌لیست
        public int? ChecklistStepId { get; set; }
        
        // NEW: ساعت برآورد و تخصیص
        public decimal? EstimatedHours { get; set; }
        public decimal? AllocatedHours { get; set; }

        // ========== اضافه شد ==========
        public DateTime? StartDate { get; set; }
        // =============================
    }
}