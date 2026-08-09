using System;

namespace Payvast.API.Models
{
    public class HashtagRule
    {
        public int Id { get; set; }
        public string Hashtag { get; set; }      // مثلاً #شناخت
        public string TargetType { get; set; }   // 'ProjectStatus' یا 'ChecklistStep'
        public string TargetValue { get; set; }  // مثلاً 'در حال اجرا' یا نام مرحله
        public DateTime CreatedAt { get; set; }
    }
}