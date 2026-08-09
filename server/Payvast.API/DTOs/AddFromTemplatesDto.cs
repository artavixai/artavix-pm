using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Payvast.API.DTOs
{
    public class AddFromTemplatesDto
    {
        [Required]
        [MinLength(1)]
        public List<int> SubsystemIds { get; set; }

        // === فیلد جدید برای تعیین تاریخ شروع ===
        public string StartDate { get; set; }
    }
}