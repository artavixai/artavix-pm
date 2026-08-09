using System;

namespace Payvast.API.Models
{
    public class ProjectDocument
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string FileName { get; set; }          // نام یکتا در سرور (مثلاً GUID)
        public string OriginalFileName { get; set; }  // نام اصلی فایل
        public long FileSize { get; set; }            // حجم به بایت
        public string FilePath { get; set; }          // مسیر نسبی (مثلاً documents/123/abc.pdf)
        public string ContentType { get; set; }       // MIME type
        public int UploadedByUserId { get; set; }
        public DateTime UploadedAt { get; set; }
        public string Description { get; set; }

        // Navigation properties
        public Project Project { get; set; }
        public User UploadedBy { get; set; }
    }
}