namespace Payvast.API.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string JobTitle { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string AvatarUrl { get; set; }
        public List<string> Roles { get; set; }

        // === فیلدهای جدید ظرفیت - فاز ۳ ===
        public int MonthlyCapacityHours { get; set; }
        public int DailyCapacityHours { get; set; }
    }
}