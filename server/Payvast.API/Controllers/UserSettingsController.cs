using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.Models;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMySetting()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var setting = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
            if (setting == null)
            {
                setting = new UserSetting { UserId = userId, MinActionDurationMinutes = 0 };
                _context.UserSettings.Add(setting);
                await _context.SaveChangesAsync();
            }
            return Ok(new { setting.MinActionDurationMinutes });
        }

        [HttpPut("my")]  // <-- اصلاح کلیدی: اضافه شدن مسیر "my"
        public async Task<IActionResult> UpdateSetting([FromBody] UpdateUserSettingDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var setting = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
            if (setting == null)
            {
                setting = new UserSetting { UserId = userId, MinActionDurationMinutes = dto.MinActionDurationMinutes };
                _context.UserSettings.Add(setting);
            }
            else
            {
                setting.MinActionDurationMinutes = dto.MinActionDurationMinutes;
            }
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class UpdateUserSettingDto
    {
        public int MinActionDurationMinutes { get; set; }
    }
}