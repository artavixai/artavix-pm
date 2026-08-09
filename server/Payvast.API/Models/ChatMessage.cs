using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Payvast.API.Models
{
    public class ChatMessage
    {
        public long Id { get; set; }
        public int ChannelId { get; set; }
        public virtual ChatChannel Channel { get; set; }
        
        public int SenderId { get; set; }
        public virtual User Sender { get; set; }
        
        public string Content { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? EditedAt { get; set; }
        public DateTime? SeenAt { get; set; }

        public long? ReplyToId { get; set; }
        public virtual ChatMessage ReplyTo { get; set; }

        // === فیلدهای جدید برای پشتیبانی از لوکیشن ===
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        // مشخص کردن رابطه معکوس برای جلوگیری از ایجاد ستون اضافی توسط EF
        [InverseProperty("Message")]
        public virtual ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
    }
}