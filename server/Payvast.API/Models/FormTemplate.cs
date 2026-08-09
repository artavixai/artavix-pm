using System.Collections.Generic;

namespace Payvast.API.Models
{
    public class FormTemplate
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }          // رنگ کارت
        public int DefaultSessionsCount { get; set; } // جمع جلسات تمام مراحل (اختیاری، می‌توان از مراحل محاسبه کرد)
        public bool IsActive { get; set; } = true;
        public System.DateTime CreatedAt { get; set; } = System.DateTime.UtcNow;

        public ICollection<FormStepTemplate> Steps { get; set; } = new List<FormStepTemplate>();
        public ICollection<ProjectForm> ProjectForms { get; set; } = new List<ProjectForm>();
    }
}