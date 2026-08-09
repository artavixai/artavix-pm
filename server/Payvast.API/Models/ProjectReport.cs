namespace Payvast.API.Models
{
    public class ProjectReport
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int ReportTemplateId { get; set; }
        public int? AssignedToUserId { get; set; }
        public string CustomCode { get; set; }

        public Project Project { get; set; }
        public ReportTemplate ReportTemplate { get; set; }
        public User AssignedToUser { get; set; }
    }
}