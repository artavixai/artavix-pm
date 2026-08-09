namespace Payvast.API.Models
{
    public class FormStepTemplate
    {
        public int Id { get; set; }
        public int FormTemplateId { get; set; }
        public int StepOrder { get; set; }
        public string StepName { get; set; }
        public int RequiredSessions { get; set; }   // تعداد جلسات مورد نیاز برای این مرحله
        public int DefaultHoursPerSession { get; set; } = 4; // ساعت پیش‌فرض هر جلسه

        public FormTemplate FormTemplate { get; set; }
    }
}