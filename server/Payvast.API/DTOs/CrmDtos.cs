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
        
        // === فیلدهای جدید اضافه شده ===
        public string Credit { get; set; } // اعتبار
        public int? CommittedHours { get; set; } // خدمات تعهد شده
        // ==============================
    }

    public class CrmLoginRequestDto
    {
        public string StartDate { get; set; }
        public string EndDate { get; set; }
    }
}