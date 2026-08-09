using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.Models;
using System.Linq;
using System.Threading.Tasks;
using Payvast.API.DTOs;

namespace Payvast.API.Controllers
{
    [Authorize(Roles = "SuperAdmin")]
    [ApiController]
    [Route("api/[controller]")]
    public class BasicDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BasicDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ====== Product Groups ======

        [HttpGet("productgroups")]
        public async Task<IActionResult> GetProductGroups()
        {
            var groups = await _context.ProductGroups
                .Include(pg => pg.Subsystems)
                .ThenInclude(s => s.TaskTemplates)
                .Select(pg => new 
                {
                    pg.Id,
                    pg.Name,
                    pg.Color,
                    Subsystems = pg.Subsystems.Select(s => new 
                    {
                        s.Id,
                        s.Name,
                        TaskTemplates = s.TaskTemplates.Select(tt => new 
                        {
                            tt.Id,
                            tt.Title,
                            tt.DefaultWeight,
                            tt.DefaultDurationInDays
                        }).OrderBy(tt => tt.Title).ToList()
                    }).OrderBy(s => s.Name).ToList()
                })
                .OrderBy(pg => pg.Name)
                .ToListAsync();

            return Ok(groups);
        }

        [HttpPost("productgroups")]
        public async Task<IActionResult> CreateProductGroup([FromBody] ProductGroupDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var productGroup = new ProductGroup { Name = dto.Name, Color = dto.Color };
            _context.ProductGroups.Add(productGroup);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProductGroups), new { id = productGroup.Id }, productGroup);
        }

        [HttpPut("productgroups/{id}")]
        public async Task<IActionResult> UpdateProductGroup(int id, [FromBody] ProductGroupDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var productGroup = await _context.ProductGroups.FindAsync(id);
            if (productGroup == null) return NotFound();

            productGroup.Name = dto.Name;
            productGroup.Color = dto.Color;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("productgroups/{id}")]
        public async Task<IActionResult> DeleteProductGroup(int id)
        {
            var productGroup = await _context.ProductGroups.Include(pg => pg.Subsystems).FirstOrDefaultAsync(pg => pg.Id == id);
            if (productGroup == null) return NotFound();
            if (productGroup.Subsystems.Any()) return BadRequest("این گروه محصول شامل زیرسیستم است و قابل حذف نیست.");

            _context.ProductGroups.Remove(productGroup);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ====== Subsystems ======

        [HttpPost("subsystems")]
        public async Task<IActionResult> CreateSubsystem([FromBody] SubsystemDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var subsystem = new Subsystem { Name = dto.Name, ProductGroupId = dto.ProductGroupId };
            _context.Subsystems.Add(subsystem);
            await _context.SaveChangesAsync();
            return Ok(subsystem);
        }
        
        [HttpPut("subsystems/{id}")]
        public async Task<IActionResult> UpdateSubsystem(int id, [FromBody] SubsystemDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var subsystem = await _context.Subsystems.FindAsync(id);
            if(subsystem == null) return NotFound();

            subsystem.Name = dto.Name;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("subsystems/{id}")]
        public async Task<IActionResult> DeleteSubsystem(int id)
        {
            var subsystem = await _context.Subsystems.Include(s => s.TaskTemplates).FirstOrDefaultAsync(s => s.Id == id);
            if (subsystem == null) return NotFound();
            if (subsystem.TaskTemplates.Any()) return BadRequest("این زیرسیستم شامل قالب تسک است و قابل حذف نیست.");

            _context.Subsystems.Remove(subsystem);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ====== Task Templates ======

        [HttpPost("tasktemplates")]
        public async Task<IActionResult> CreateTaskTemplate([FromBody] TaskTemplateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var template = new TaskTemplate
            {
                Title = dto.Title,
                DefaultWeight = dto.DefaultWeight,
                DefaultDurationInDays = dto.DefaultDurationInDays > 0 ? dto.DefaultDurationInDays : 1,
                SubsystemId = dto.SubsystemId
            };
            _context.TaskTemplates.Add(template);
            await _context.SaveChangesAsync();
            return Ok(template);
        }
        
        [HttpPut("tasktemplates/{id}")]
        public async Task<IActionResult> UpdateTaskTemplate(int id, [FromBody] TaskTemplateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var template = await _context.TaskTemplates.FindAsync(id);
            if(template == null) return NotFound();

            template.Title = dto.Title;
            template.DefaultWeight = dto.DefaultWeight;
            template.DefaultDurationInDays = dto.DefaultDurationInDays > 0 ? dto.DefaultDurationInDays : 1;
            
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("tasktemplates/{id}")]
        public async Task<IActionResult> DeleteTaskTemplate(int id)
        {
            var template = await _context.TaskTemplates.FindAsync(id);
            if (template == null) return NotFound();
            
            _context.TaskTemplates.Remove(template);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ======================= NEW: Step Templates =======================

        [HttpGet("steptemplates")]
        public async Task<IActionResult> GetStepTemplates()
        {
            var steps = await _context.ProjectStepTemplates
                .Include(pst => pst.ProductGroup)
                .OrderBy(pst => pst.ProductGroupId).ThenBy(pst => pst.DisplayOrder)
                .Select(pst => new StepTemplateDto
                {
                    Id = pst.Id,
                    ProductGroupId = pst.ProductGroupId,
                    ProductGroupName = pst.ProductGroup.Name,
                    StepName = pst.StepName,
                    DisplayOrder = pst.DisplayOrder,
                    IsActive = pst.IsActive
                })
                .ToListAsync();
            return Ok(steps);
        }

        [HttpGet("steptemplates/byproductgroup/{productGroupId}")]
        public async Task<IActionResult> GetStepTemplatesByProductGroup(int productGroupId)
        {
            // اصلاح: حذف شرط IsActive تا همه مراحل (فعال و غیرفعال) برگردند
            var steps = await _context.ProjectStepTemplates
                .Where(pst => pst.ProductGroupId == productGroupId)
                .OrderBy(pst => pst.DisplayOrder)
                .Select(pst => new StepTemplateDto
                {
                    Id = pst.Id,
                    ProductGroupId = pst.ProductGroupId,
                    StepName = pst.StepName,
                    DisplayOrder = pst.DisplayOrder,
                    IsActive = pst.IsActive
                })
                .ToListAsync();
            return Ok(steps);
        }

        [HttpPost("steptemplates")]
        public async Task<IActionResult> CreateStepTemplate([FromBody] StepTemplateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var step = new ProjectStepTemplate
            {
                ProductGroupId = dto.ProductGroupId,
                StepName = dto.StepName,
                DisplayOrder = dto.DisplayOrder,
                IsActive = dto.IsActive
            };
            _context.ProjectStepTemplates.Add(step);
            await _context.SaveChangesAsync();
            dto.Id = step.Id;
            return Ok(dto);
        }

        [HttpPut("steptemplates/{id}")]
        public async Task<IActionResult> UpdateStepTemplate(int id, [FromBody] StepTemplateDto dto)
        {
            var step = await _context.ProjectStepTemplates.FindAsync(id);
            if (step == null) return NotFound();
            step.StepName = dto.StepName;
            step.DisplayOrder = dto.DisplayOrder;
            step.IsActive = dto.IsActive;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("steptemplates/{id}")]
        public async Task<IActionResult> DeleteStepTemplate(int id)
        {
            var step = await _context.ProjectStepTemplates.FindAsync(id);
            if (step == null) return NotFound();
            _context.ProjectStepTemplates.Remove(step);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}