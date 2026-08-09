using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetStats()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var inProgressTasks = await _context.Tasks
                .CountAsync(t => t.AssigneeId == userId && t.Status == "InProgress");

            // کوئری ساده‌تر برای شمارش پروژه‌های فعال
            var activeProjects = await _context.Projects
                .Where(p => p.Status == "در حال اجرا")
                .CountAsync();
            
            var stats = new DashboardStatsDto
            {
                InProgressTasks = inProgressTasks,
                ActiveProjects = activeProjects,
                TrackableTasks = 0,
                TodaysTasks = 0,
            };

            return Ok(stats);
        }
    }
}