using System;

namespace Payvast.API.Models
{
    public class ProjectChecklist
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string StepName { get; set; }   // مراحل هفت‌گانه: "شناخت", "مستند", "طراحی", "تست", "آموزش", "رفع اشکال", "تحویل"
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int? CompletedByUserId { get; set; }

        public Project Project { get; set; }
        public User CompletedBy { get; set; }
    }
}