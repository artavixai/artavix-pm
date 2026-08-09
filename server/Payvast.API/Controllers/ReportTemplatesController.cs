using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
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
    public class ReportTemplatesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportTemplatesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReportTemplateDto>>> GetAll()
        {
            var reports = await _context.ReportTemplates
                .Include(r => r.Steps)
                .Where(r => r.IsActive)
                .Select(r => new ReportTemplateDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Color = r.Color,
                    DefaultSessionsCount = r.DefaultSessionsCount,
                    Steps = r.Steps.OrderBy(s => s.StepOrder).Select(s => new ReportStepTemplateDto
                    {
                        Id = s.Id,
                        StepOrder = s.StepOrder,
                        StepName = s.StepName,
                        RequiredSessions = s.RequiredSessions,
                        DefaultHoursPerSession = s.DefaultHoursPerSession
                    }).ToList()
                })
                .ToListAsync();
            return Ok(reports);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ReportTemplateDto>> GetById(int id)
        {
            var report = await _context.ReportTemplates
                .Include(r => r.Steps)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (report == null) return NotFound();

            return Ok(new ReportTemplateDto
            {
                Id = report.Id,
                Name = report.Name,
                Color = report.Color,
                DefaultSessionsCount = report.DefaultSessionsCount,
                Steps = report.Steps.OrderBy(s => s.StepOrder).Select(s => new ReportStepTemplateDto
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
        public async Task<ActionResult<ReportTemplateDto>> Create(CreateReportTemplateDto dto)
        {
            var report = new ReportTemplate
            {
                Name = dto.Name,
                Color = dto.Color ?? GenerateRandomColor(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                DefaultSessionsCount = dto.Steps?.Sum(s => s.RequiredSessions) ?? 0
            };

            if (dto.Steps != null && dto.Steps.Any())
            {
                report.Steps = dto.Steps.Select(s => new ReportStepTemplate
                {
                    StepOrder = s.StepOrder,
                    StepName = s.StepName,
                    RequiredSessions = s.RequiredSessions,
                    DefaultHoursPerSession = s.DefaultHoursPerSession > 0 ? s.DefaultHoursPerSession : 4
                }).ToList();
            }

            _context.ReportTemplates.Add(report);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = report.Id }, new ReportTemplateDto
            {
                Id = report.Id,
                Name = report.Name,
                Color = report.Color,
                DefaultSessionsCount = report.DefaultSessionsCount,
                Steps = report.Steps.Select(s => new ReportStepTemplateDto
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
        public async Task<IActionResult> Update(int id, UpdateReportTemplateDto dto)
        {
            var report = await _context.ReportTemplates
                .Include(r => r.Steps)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (report == null) return NotFound();

            report.Name = dto.Name;
            report.Color = dto.Color ?? report.Color;
            report.IsActive = dto.IsActive;

            // حذف مراحل قبلی
            _context.ReportStepTemplates.RemoveRange(report.Steps);

            // افزودن مراحل جدید
            if (dto.Steps != null && dto.Steps.Any())
            {
                report.Steps = dto.Steps.Select(s => new ReportStepTemplate
                {
                    StepOrder = s.StepOrder,
                    StepName = s.StepName,
                    RequiredSessions = s.RequiredSessions,
                    DefaultHoursPerSession = s.DefaultHoursPerSession > 0 ? s.DefaultHoursPerSession : 4
                }).ToList();
                report.DefaultSessionsCount = dto.Steps.Sum(s => s.RequiredSessions);
            }
            else
            {
                report.DefaultSessionsCount = 0;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var report = await _context.ReportTemplates.FindAsync(id);
            if (report == null) return NotFound();

            _context.ReportTemplates.Remove(report);
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

    // DTOs
    public class ReportTemplateDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public int DefaultSessionsCount { get; set; }
        public List<ReportStepTemplateDto> Steps { get; set; }
    }

    public class ReportStepTemplateDto
    {
        public int Id { get; set; }
        public int StepOrder { get; set; }
        public string StepName { get; set; }
        public int RequiredSessions { get; set; }
        public int DefaultHoursPerSession { get; set; }
    }

    public class CreateReportTemplateDto
    {
        public string Name { get; set; }
        public string Color { get; set; }
        public List<CreateReportStepTemplateDto> Steps { get; set; }
    }

    public class UpdateReportTemplateDto
    {
        public string Name { get; set; }
        public string Color { get; set; }
        public bool IsActive { get; set; }
        public List<CreateReportStepTemplateDto> Steps { get; set; }
    }

    public class CreateReportStepTemplateDto
    {
        public int StepOrder { get; set; }
        public string StepName { get; set; }
        public int RequiredSessions { get; set; }
        public int DefaultHoursPerSession { get; set; }
    }
}