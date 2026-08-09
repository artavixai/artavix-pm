using System;

namespace Payvast.API.DTOs
{
    public class ProjectStatusReportDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EstimatedEndDate { get; set; }  // تاریخ برآورد پایان (از EndDate پروژه)
        public decimal TotalEstimatedHours { get; set; }   // جمع کل ساعات برآورد شده (از تسک‌های گانت)
        public decimal TotalAllocatedHours { get; set; }   // جمع ساعت اقدام شده (زمان تخصیص یافته)
        public decimal TotalRemainingHours { get; set; }   // جمع ساعت باقی‌مانده (محاسباتی)
        public double Progress { get; set; }               // درصد پیشرفت
        public string Status { get; set; }                 // وضعیت پروژه
        public string ProjectManagerName { get; set; }     // کارشناس مسئول (مدیر پروژه)
        public string CustomStatus { get; set; }           // وضعیت سفارشی (اختیاری)
        public string BlockedBy { get; set; }              // توقف اداری توسط
        public string BlockedReason { get; set; }          // دلیل توقف
    }
}