namespace Payvast.API.Models
{
    public class Note
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Category { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? ReminderDate { get; set; }
        public bool ReminderSent { get; set; }
        public DateTime? SnoozedUntil { get; set; }
        public int? ReminderOffsetMinutes { get; set; }
        public User User { get; set; }
    }
}