namespace Payvast.API.DTOs
{
    public class NoteDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Category { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? ReminderDate { get; set; }
        
        // === شروع تغییرات ===
        public int? ReminderOffsetMinutes { get; set; } // اضافه کردن فیلد زمان هشدار
        // === پایان تغییرات ===
    }
}