using System;

namespace Payvast.API.DTOs
{
    public class CrmProjectImportDto
    {
        public string CrmCode { get; set; }
        public string Title { get; set; }
        public string BuyerName { get; set; }
        public string Status { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public string ProjectManager { get; set; }
        public string SupportType { get; set; }
        public string Credit { get; set; }
        public int? CommittedHours { get; set; }
    }

    public class CrmLoginRequestDto
    {
        public string StartDate { get; set; }
        public string EndDate { get; set; }
    }

    public class CrmActionDto
    {
        public string User { get; set; }
        public string ActionDateStr { get; set; }
        public string ActivityType { get; set; }
        public string Duration { get; set; }
        public string Description { get; set; }
        public string NextAction { get; set; }
    }
}