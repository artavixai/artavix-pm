using System.ComponentModel.DataAnnotations;

namespace Payvast.API.DTOs
{
    public class CreateUpdateNoteDto
    {
        [Required]
        public string Title { get; set; }
        public string Content { get; set; }
        public string Category { get; set; }
        public DateTime? ReminderDate { get; set; }
        public int? ReminderOffsetMinutes { get; set; }
    }
}