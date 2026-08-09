using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Payvast.API.Controllers
{
    [Authorize(Roles = "SuperAdmin,ProjectManager")]
    [ApiController]
    [Route("api/[controller]")]
    public class FormTemplatesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FormTemplatesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FormTemplateDto>>> GetAll()
        {
            var forms = await _context.FormTemplates
                .Include(f => f.Steps)
                .Where(f => f.IsActive)
                .Select(f => new FormTemplateDto
                {
                    Id = f.Id,
                    Name = f.Name,
                    Color = f.Color,
                    DefaultSessionsCount = f.DefaultSessionsCount,
                    Steps = f.Steps.OrderBy(s => s.StepOrder).Select(s => new FormStepTemplateDto
                    {
                        Id = s.Id,
                        StepOrder = s.StepOrder,
                        StepName = s.StepName,
                        RequiredSessions = s.RequiredSessions,
                        DefaultHoursPerSession = s.DefaultHoursPerSession
                    }).ToList()
                })
                .ToListAsync();

            return Ok(forms);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FormTemplateDto>> GetById(int id)
        {
            var form = await _context.FormTemplates
                .Include(f => f.Steps)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (form == null) return NotFound();

            return Ok(new FormTemplateDto
            {
                Id = form.Id,
                Name = form.Name,
                Color = form.Color,
                DefaultSessionsCount = form.DefaultSessionsCount,
                Steps = form.Steps.OrderBy(s => s.StepOrder).Select(s => new FormStepTemplateDto
                {
                    Id = s.Id,
                    StepOrder = s.StepOrder,
                    StepName = s.StepName,
                    RequiredSessions = s.RequiredSessions,
                    DefaultHoursPerSession = s.DefaultHoursPerSession
                }).ToList()
            });
        }

        [HttpPost]
        public async Task<ActionResult<FormTemplateDto>> Create(CreateFormTemplateDto dto)
        {
            var form = new FormTemplate
            {
                Name = dto.Name,
                Color = dto.Color ?? GenerateRandomColor(),
                DefaultSessionsCount = dto.Steps?.Sum(s => s.RequiredSessions) ?? 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (dto.Steps != null && dto.Steps.Any())
            {
                form.Steps = dto.Steps.Select(s => new FormStepTemplate
                {
                    StepOrder = s.StepOrder,
                    StepName = s.StepName,
                    RequiredSessions = s.RequiredSessions,
                    DefaultHoursPerSession = s.DefaultHoursPerSession > 0 ? s.DefaultHoursPerSession : 4
                }).ToList();
            }

            _context.FormTemplates.Add(form);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = form.Id }, new FormTemplateDto
            {
                Id = form.Id,
                Name = form.Name,
                Color = form.Color,
                DefaultSessionsCount = form.DefaultSessionsCount,
                Steps = form.Steps.Select(s => new FormStepTemplateDto
                {
                    Id = s.Id,
                    StepOrder = s.StepOrder,
                    StepName = s.StepName,
                    RequiredSessions = s.RequiredSessions,
                    DefaultHoursPerSession = s.DefaultHoursPerSession
                }).ToList()
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateFormTemplateDto dto)
        {
            var form = await _context.FormTemplates
                .Include(f => f.Steps)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (form == null) return NotFound();

            form.Name = dto.Name;
            form.Color = dto.Color ?? form.Color;
            form.IsActive = dto.IsActive;

            _context.FormStepTemplates.RemoveRange(form.Steps);

            if (dto.Steps != null && dto.Steps.Any())
            {
                form.Steps = dto.Steps.Select(s => new FormStepTemplate
                {
                    StepOrder = s.StepOrder,
                    StepName = s.StepName,
                    RequiredSessions = s.RequiredSessions,
                    DefaultHoursPerSession = s.DefaultHoursPerSession > 0 ? s.DefaultHoursPerSession : 4
                }).ToList();
                form.DefaultSessionsCount = dto.Steps.Sum(s => s.RequiredSessions);
            }
            else
            {
                form.DefaultSessionsCount = 0;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var form = await _context.FormTemplates.FindAsync(id);
            if (form == null) return NotFound();

            _context.FormTemplates.Remove(form);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private string GenerateRandomColor()
        {
            var colors = new[] { "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316" };
            var random = new Random();
            return colors[random.Next(colors.Length)];
        }
    }

    public class FormTemplateDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public int DefaultSessionsCount { get; set; }
        public List<FormStepTemplateDto> Steps { get; set; } = new List<FormStepTemplateDto>();
    }

    public class FormStepTemplateDto
    {
        public int Id { get; set; }
        public int StepOrder { get; set; }
        public string StepName { get; set; }
        public int RequiredSessions { get; set; }
        public int DefaultHoursPerSession { get; set; }
    }

    public class CreateFormTemplateDto
    {
        public string Name { get; set; }
        public string Color { get; set; }
        public List<CreateFormStepTemplateDto> Steps { get; set; } = new List<CreateFormStepTemplateDto>();
    }

    public class UpdateFormTemplateDto
    {
        public string Name { get; set; }
        public string Color { get; set; }
        public bool IsActive { get; set; }
        public List<CreateFormStepTemplateDto> Steps { get; set; } = new List<CreateFormStepTemplateDto>();
    }

    public class CreateFormStepTemplateDto
    {
        public int StepOrder { get; set; }
        public string StepName { get; set; }
        public int RequiredSessions { get; set; }
        public int DefaultHoursPerSession { get; set; }
    }
}