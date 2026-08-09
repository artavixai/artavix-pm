using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MeetingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MeetingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Meetings?projectId=123&startDate=...&endDate=...
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MeetingDto>>> GetMeetings(
            [FromQuery] int? projectId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");

            var query = _context.Meetings.AsQueryable();

            if (projectId.HasValue)
            {
                query = query.Where(m => m.ProjectId == projectId);
            }
            else if (!isAdmin)
            {
                // اگر کاربر معمولی است و پروژه مشخص نشده، فقط جلساتی که خودش ایجاد کرده یا در آن شرکت دارد را ببین
                query = query.Where(m => m.CreatedByUserId == userId);
            }

            if (startDate.HasValue)
                query = query.Where(m => m.StartTime >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(m => m.EndTime <= endDate.Value);

            // ابتدا داده‌ها را از دیتابیس واکشی می‌کنیم (بدون تبدیل JSON)
            var meetingsData = await query
                .Include(m => m.CreatedBy)
                .OrderBy(m => m.StartTime)
                .Select(m => new
                {
                    m.Id,
                    m.Title,
                    m.StartTime,
                    m.EndTime,
                    m.Agenda,
                    m.Color,
                    m.ProjectId,
                    m.CreatedByUserId,
                    CreatedByFullName = m.CreatedBy.FullName,
                    m.CreatedAt,
                    m.ParticipantsJson
                })
                .ToListAsync();

            // تبدیل ParticipantsJson در سمت کلاینت (بعد از مادی‌سازی)
            var meetings = meetingsData.Select(m => new MeetingDto
            {
                Id = m.Id,
                Title = m.Title,
                StartTime = m.StartTime,
                EndTime = m.EndTime,
                Agenda = m.Agenda,
                Color = m.Color,
                ProjectId = m.ProjectId,
                CreatedByUserId = m.CreatedByUserId,
                CreatedByFullName = m.CreatedByFullName,
                CreatedAt = m.CreatedAt,
                Participants = string.IsNullOrEmpty(m.ParticipantsJson)
                    ? new List<MeetingParticipantDto>()
                    : JsonSerializer.Deserialize<List<MeetingParticipantDto>>(m.ParticipantsJson)
            }).ToList();

            return Ok(meetings);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MeetingDto>> GetMeeting(int id)
        {
            var meeting = await _context.Meetings
                .Include(m => m.CreatedBy)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (meeting == null) return NotFound();

            return Ok(new MeetingDto
            {
                Id = meeting.Id,
                Title = meeting.Title,
                StartTime = meeting.StartTime,
                EndTime = meeting.EndTime,
                Agenda = meeting.Agenda,
                Color = meeting.Color,
                ProjectId = meeting.ProjectId,
                CreatedByUserId = meeting.CreatedByUserId,
                CreatedByFullName = meeting.CreatedBy?.FullName,
                CreatedAt = meeting.CreatedAt,
                Participants = string.IsNullOrEmpty(meeting.ParticipantsJson)
                    ? new List<MeetingParticipantDto>()
                    : JsonSerializer.Deserialize<List<MeetingParticipantDto>>(meeting.ParticipantsJson)
            });
        }

        [HttpPost]
        public async Task<ActionResult<MeetingDto>> CreateMeeting(CreateMeetingDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var meeting = new Meeting
            {
                Title = dto.Title,
                StartTime = dto.StartTime.ToUniversalTime(),
                EndTime = dto.EndTime.ToUniversalTime(),
                Agenda = dto.Agenda,
                Color = dto.Color ?? "#3b82f6",
                ProjectId = dto.ProjectId,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                ParticipantsJson = JsonSerializer.Serialize(dto.Participants ?? new List<MeetingParticipantDto>())
            };

            _context.Meetings.Add(meeting);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMeeting), new { id = meeting.Id }, new MeetingDto
            {
                Id = meeting.Id,
                Title = meeting.Title,
                StartTime = meeting.StartTime,
                EndTime = meeting.EndTime,
                Agenda = meeting.Agenda,
                Color = meeting.Color,
                ProjectId = meeting.ProjectId,
                CreatedByUserId = meeting.CreatedByUserId,
                CreatedByFullName = User.FindFirstValue(ClaimTypes.Name),
                CreatedAt = meeting.CreatedAt,
                Participants = dto.Participants ?? new List<MeetingParticipantDto>()
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMeeting(int id, UpdateMeetingDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var meeting = await _context.Meetings.FindAsync(id);

            if (meeting == null) return NotFound();
            if (meeting.CreatedByUserId != userId && !User.IsInRole("SuperAdmin"))
                return Forbid();

            meeting.Title = dto.Title;
            meeting.StartTime = dto.StartTime.ToUniversalTime();
            meeting.EndTime = dto.EndTime.ToUniversalTime();
            meeting.Agenda = dto.Agenda;
            meeting.Color = dto.Color ?? meeting.Color;
            meeting.ProjectId = dto.ProjectId;
            meeting.UpdatedAt = DateTime.UtcNow;
            meeting.ParticipantsJson = JsonSerializer.Serialize(dto.Participants ?? new List<MeetingParticipantDto>());

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMeeting(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var meeting = await _context.Meetings.FindAsync(id);

            if (meeting == null) return NotFound();
            if (meeting.CreatedByUserId != userId && !User.IsInRole("SuperAdmin"))
                return Forbid();

            _context.Meetings.Remove(meeting);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class MeetingDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Agenda { get; set; }
        public string Color { get; set; }
        public int? ProjectId { get; set; }
        public int CreatedByUserId { get; set; }
        public string CreatedByFullName { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<MeetingParticipantDto> Participants { get; set; }
    }

    public class MeetingParticipantDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }

    public class CreateMeetingDto
    {
        public string Title { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Agenda { get; set; }
        public string Color { get; set; }
        public int? ProjectId { get; set; }
        public List<MeetingParticipantDto> Participants { get; set; }
    }

    public class UpdateMeetingDto
    {
        public string Title { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Agenda { get; set; }
        public string Color { get; set; }
        public int? ProjectId { get; set; }
        public List<MeetingParticipantDto> Participants { get; set; }
    }
}