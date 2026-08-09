namespace Payvast.API.DTOs
{
    public class ChatMessageDto
    {
        public long Id { get; set; }
        public int ChannelId { get; set; }
        public int SenderId { get; set; }
        public string SenderFullName { get; set; }
        public string SenderAvatarUrl { get; set; }
        public string Content { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? EditedAt { get; set; }

        // === شروع تغییرات ===
        public DateTime? SeenAt { get; set; }
        // === فیلدهای جدید برای لوکیشن ===
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}