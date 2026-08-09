namespace Payvast.API.Models
{
    public class UnreadMessage
    {
        public int Id { get; set; }
        public int ChannelId { get; set; }
        public int UserId { get; set; } // کاربری که هنوز پیام را نخوانده
        public long MessageId { get; set; } // شناسه پیامی که خوانده نشده

        // Navigation Properties
        public ChatChannel Channel { get; set; }
        public User User { get; set; }
        public ChatMessage Message { get; set; }
    }
}