using System.ComponentModel.DataAnnotations;
// === شروع تغییرات ===
// این using برای شناسایی نوع IFormFile ضروری است
using Microsoft.AspNetCore.Http; 
// === پایان تغییرات ===

namespace Payvast.API.DTOs
{
    public class CreateUserDto
    {
        [Required]
        public string Username { get; set; }
        
        [Required]
        public string FullName { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        public string Password { get; set; }

        public string JobTitle { get; set; }

        [Required]
        public string PhoneNumber { get; set; }

        public bool IsActive { get; set; } = true;
        
        [Required]
        public List<int> RoleIds { get; set; }

        // === شروع تغییرات ===
        // این فیلد برای دریافت فایل تصویر پروفایل اضافه شد
        public IFormFile AvatarFile { get; set; } 
        // === پایان تغییرات ===
    }
}