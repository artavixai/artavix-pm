namespace Payvast.API.Models
{
    public class ProjectForm
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }          // پروژه مادری که این فرم به آن تعلق دارد
        public int FormTemplateId { get; set; }
        public int? AssignedToUserId { get; set; }   // کارشناس اختصاصی برای این فرم
        public string CustomCode { get; set; }       // کد یکتای تولید شده

        public Project Project { get; set; }
        public FormTemplate FormTemplate { get; set; }
        public User AssignedToUser { get; set; }
    }
}