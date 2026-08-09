using System;
using System.Collections.Generic;

namespace Payvast.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }
        public bool IsActive { get; set; }

        // فیلدهای جدید برای پست سازمانی و شماره موبایل
        public string JobTitle { get; set; }
        public string PhoneNumber { get; set; }

        // فیلد جدید برای ظرفیت ماهانه (ساعت)
        public int MonthlyCapacityHours { get; set; } = 198; // پیش‌فرض 9 ساعت * 22 روز کاری
        
        // فیلد جدید برای ظرفیت روزانه (ساعت) - فاز ۳
        public int DailyCapacityHours { get; set; } = 9;

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}