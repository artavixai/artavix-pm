using System;

namespace Payvast.API.DTOs
{
    public class ChartDataDto
    {
        public string Label { get; set; } // عنوان بازه زمانی (مثلاً نام ماه یا هفته)
        public double ActualProgress { get; set; } // پیشرفت واقعی ثبت شده
        public double PlannedProgress { get; set; } // پیشرفتی که باید طبق تقویم می‌داشتیم
    }
}