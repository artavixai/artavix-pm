namespace Payvast.API.Models
{
    public class UserSetting
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int MinActionDurationMinutes { get; set; } // حداقل دقیقه برای نمایش اقدامات

        public User User { get; set; }
    }
}