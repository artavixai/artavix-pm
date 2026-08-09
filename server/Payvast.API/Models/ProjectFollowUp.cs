using System;

namespace Payvast.API.Models
{
    public class ProjectFollowUp
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int UserId { get; set; }           // کارشناس ثبت‌کننده
        public string Content { get; set; }       // متن ملاحظه
        public DateTime FollowUpDate { get; set; } // تاریخ پیگیری (UTC)
        public bool IsResolved { get; set; }      // آیا حل شده؟
        public DateTime CreatedAt { get; set; }

        // NEW: فیلدهای یادآوری
        public DateTime? ReminderDate { get; set; } // زمان یادآوری (UTC)
        public bool ReminderSent { get; set; }     // آیا یادآوری ارسال شده؟

        // Navigation Properties
        public Project Project { get; set; }
        public User User { get; set; }
    }
}