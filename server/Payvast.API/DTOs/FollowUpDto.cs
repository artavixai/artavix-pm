using System;

namespace Payvast.API.DTOs
{
    public class FollowUpDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int UserId { get; set; }
        public string UserFullName { get; set; }
        public string Content { get; set; }
        public DateTime FollowUpDate { get; set; }
        public bool IsResolved { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReminderDate { get; set; }   // NEW
        public bool ReminderSent { get; set; }        // NEW
    }

    public class CreateFollowUpDto
    {
        public int ProjectId { get; set; }
        public string Content { get; set; }
        public DateTime FollowUpDate { get; set; }
        public bool IsResolved { get; set; }
        public DateTime? ReminderDate { get; set; }   // NEW (اختیاری)
    }

    public class UpdateFollowUpDto
    {
        public string Content { get; set; }
        public DateTime FollowUpDate { get; set; }
        public bool IsResolved { get; set; }
        public DateTime? ReminderDate { get; set; }   // NEW
    }
}