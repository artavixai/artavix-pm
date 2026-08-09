using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Payvast.API.Controllers
{
    [Authorize(Roles = "SuperAdmin")]
    [ApiController]
    [Route("api/[controller]")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public SystemSettingsController(ApplicationDbContext context) => _context = context;

        // GET: api/SystemSettings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SystemSetting>>> GetAll()
        {
            var settings = await _context.SystemSettings.ToListAsync();
            if (!settings.Any())
            {
                var defaults = new List<SystemSetting>
                {
                    new SystemSetting { FeatureName = "GanttChart", IsEnabled = true, Description = "Show Gantt Chart in sidebar menu" },
                    new SystemSetting { FeatureName = "TaskTemplates", IsEnabled = true, Description = "Manage task templates in settings" },
                    new SystemSetting { FeatureName = "AdvancedReports", IsEnabled = true, Description = "Advanced analytics reports" }
                };
                _context.SystemSettings.AddRange(defaults);
                await _context.SaveChangesAsync();
                settings = defaults;
            }
            return Ok(settings);
        }

        // PUT: api/SystemSettings/{featureName}
        [HttpPut("{featureName}")]
        public async Task<IActionResult> Update(string featureName, [FromBody] UpdateFeatureDto dto)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.FeatureName == featureName);
            if (setting == null) return NotFound();
            setting.IsEnabled = dto.IsEnabled;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class UpdateFeatureDto
    {
        public bool IsEnabled { get; set; }
    }
}