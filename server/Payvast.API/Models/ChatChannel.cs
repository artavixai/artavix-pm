namespace Payvast.API.Models
{
    public class ChatChannel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsPrivate { get; set; }
        public DateTime CreatedAt { get; set; }

        // === شروع تغییرات ===
        // نوع کانال را مشخص می‌کند: "Project" یا "Direct"
        public string ChannelType { get; set; }

        // کلید خارجی برای کانال‌های مرتبط با پروژه
        public int? ProjectId { get; set; }
        public Project Project { get; set; } // Navigation Property
        // === پایان تغییرات ===

        public ICollection<ChatChannelMember> Members { get; set; } = new List<ChatChannelMember>();
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}