using System;
using System.Collections.Generic;

namespace Payvast.API.Models
{
    public class Meeting
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime StartTime { get; set; }    // UTC
        public DateTime EndTime { get; set; }      // UTC
        public string Agenda { get; set; }
        public string Color { get; set; }
        public int? ProjectId { get; set; }        // اختیاری: مرتبط با پروژه
        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // شرکت‌کنندگان: به صورت JSON ذخیره می‌شود (برای سادگی)
        public string ParticipantsJson { get; set; } // آرایه از {id, name, email}

        public Project Project { get; set; }
        public User CreatedBy { get; set; }
    }
}