using System;
using System.Collections.Generic;

namespace Payvast.API.Models
{
    public class CrmStatusRule
    {
        public int Id { get; set; }
        public string Hashtag { get; set; }
        public string TargetStatus { get; set; }
    }

    public class CrmReport
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string CrmCreatorName { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ImportedAt { get; set; }
        public Project Project { get; set; }
    }

    public class CrmProjectCache
    {
        public int Id { get; set; }
        public string CrmCode { get; set; }
        public string Title { get; set; }
        public string BuyerName { get; set; }
        public string ProjectManager { get; set; }
        public string Status { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public string SupportType { get; set; }
        public string Credit { get; set; }
        public int? CommittedHours { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    // === مدل جدید برای اقدامات مرتبط ===
    public class CrmAction
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string CrmUser { get; set; }
        public DateTime ActionDate { get; set; }
        public string ActivityType { get; set; }
        public string Duration { get; set; }
        public string Description { get; set; }
        public string NextAction { get; set; }
        public DateTime ImportedAt { get; set; }
        public Project Project { get; set; }
    }
}