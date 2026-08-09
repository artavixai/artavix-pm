namespace Payvast.API.DTOs
{
    public class TaskTemplateDto
    {
        public string Title { get; set; }
        public int? DefaultWeight { get; set; }
        public int DefaultDurationInDays { get; set; }
        public int SubsystemId { get; set; }
    }
}