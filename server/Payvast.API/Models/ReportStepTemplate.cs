namespace Payvast.API.Models
{
    public class ReportStepTemplate
    {
        public int Id { get; set; }
        public int ReportTemplateId { get; set; }
        public int StepOrder { get; set; }
        public string StepName { get; set; }
        public int RequiredSessions { get; set; }
        public int DefaultHoursPerSession { get; set; } = 4;

        public ReportTemplate ReportTemplate { get; set; }
    }
}