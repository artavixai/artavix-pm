using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using Payvast.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CrmController : ControllerBase
    {
        private readonly CrmScraperService _scraperService;
        private readonly ApplicationDbContext _context;

        public CrmController(CrmScraperService scraperService, ApplicationDbContext context)
        {
            _scraperService = scraperService;
            _context = context;
        }

        [HttpPost("import-projects")]
        public async Task<IActionResult> ImportProjects([FromBody] CrmLoginRequestDto request)
        {
            try
            {
                var projects = await _scraperService.GetCachedProjectsAsync();
                var lastUpdate = await _scraperService.GetLastUpdateTimeAsync();
                
                if (projects.Count == 0)
                {
                    await _scraperService.SyncCrmDataAsync();
                    projects = await _scraperService.GetCachedProjectsAsync();
                    lastUpdate = System.DateTime.UtcNow;
                }

                return Ok(new { 
                    Projects = projects, 
                    LastUpdate = lastUpdate 
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, $"خطا در دریافت اطلاعات: {ex.Message}");
            }
        }

        // ===== NEW: Force Sync Endpoint =====
        [HttpPost("force-sync")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> ForceSync()
        {
            try
            {
                await _scraperService.SyncCrmDataAsync();
                return Ok(new { message = "همگام‌سازی با موفقیت انجام شد." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, $"خطا در همگام‌سازی: {ex.Message}");
            }
        }

        [HttpGet("project-actions/{projectId}")]
        public async Task<IActionResult> GetProjectActions(int projectId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userSetting = await _context.UserSettings.FirstOrDefaultAsync(u => u.UserId == userId);
            var minDuration = userSetting?.MinActionDurationMinutes ?? 0;

            var actions = await _context.CrmActions
                .Where(a => a.ProjectId == projectId)
                .ToListAsync();

            var filteredActions = actions
                .Where(a => ConvertDurationToMinutes(a.Duration) >= minDuration)
                .OrderByDescending(a => a.ActionDate)
                .ToList();

            return Ok(filteredActions);
        }

        [HttpPost("sync-actions/{projectId}")]
        public async Task<IActionResult> SyncActions(int projectId)
        {
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null) return NotFound("پروژه یافت نشد.");

                if (string.IsNullOrEmpty(project.CrmCode))
                    return BadRequest("این پروژه فاقد کد CRM برای همگام‌سازی است.");

                await _scraperService.SyncProjectActionsAsync(projectId, project.CrmCode, project.Title);
                
                return Ok("بروزرسانی اقدامات با موفقیت انجام شد.");
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, $"خطا در بروزرسانی اقدامات: {ex.Message}");
            }
        }

        private int ConvertDurationToMinutes(string duration)
        {
            if (string.IsNullOrEmpty(duration)) return 0;
            var parts = duration.Split(':');
            if (parts.Length == 2)
            {
                int hours = int.Parse(parts[0]);
                int minutes = int.Parse(parts[1]);
                return hours * 60 + minutes;
            }
            return 0;
        }

        [HttpGet("rules")]
        public async Task<IActionResult> GetRules()
        {
            return Ok(await _context.CrmStatusRules.ToListAsync());
        }

        [HttpPost("rules")]
        public async Task<IActionResult> AddRule([FromBody] CrmStatusRule rule)
        {
            _context.CrmStatusRules.Add(rule);
            await _context.SaveChangesAsync();
            return Ok(rule);
        }

        [HttpDelete("rules/{id}")]
        public async Task<IActionResult> DeleteRule(int id)
        {
            var rule = await _context.CrmStatusRules.FindAsync(id);
            if (rule == null) return NotFound();
            _context.CrmStatusRules.Remove(rule);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}