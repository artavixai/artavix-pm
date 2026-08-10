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
                query = query.Where(m => m.CreatedByUserId == userId);
            }

            if (startDate.HasValue)
                query = query.Where(m => m.StartTime >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(m => m.EndTime <= endDate.Value);

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
                    CreatedByFullName = m.CreatedBy != null ? m.CreatedBy.FullName : "System",
                    m.CreatedAt,
                    m.ParticipantsJson
                })
                .ToListAsync();

            var meetings = meetingsData.Select(m => {
                var participantList = new List<MeetingParticipantDto>();
                if (!string.IsNullOrEmpty(m.ParticipantsJson) && m.ParticipantsJson != "null")
                {
                    try {
                        var deserialized = JsonSerializer.Deserialize<List<MeetingParticipantDto>>(m.ParticipantsJson);
                        if (deserialized != null) {
                            participantList = deserialized.Where(p => p != null).ToList();
                        }
                    } catch {}
                }

                return new MeetingDto
                {
                    Id = m.Id,
                    Title = m.Title ?? "Untitled Meeting",
                    StartTime = m.StartTime,
                    EndTime = m.EndTime,
                    Agenda = m.Agenda ?? "",
                    Color = m.Color ?? "#3b82f6",
                    ProjectId = m.ProjectId,
                    CreatedByUserId = m.CreatedByUserId,
                    CreatedByFullName = m.CreatedByFullName,
                    CreatedAt = m.CreatedAt,
                    Participants = participantList
                };
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

            var participantList = new List<MeetingParticipantDto>();
            if (!string.IsNullOrEmpty(meeting.ParticipantsJson) && meeting.ParticipantsJson != "null")
            {
                try {
                    var deserialized = JsonSerializer.Deserialize<List<MeetingParticipantDto>>(meeting.ParticipantsJson);
                    if (deserialized != null) {
                        participantList = deserialized.Where(p => p != null).ToList();
                    }
                } catch {}
            }

            return Ok(new MeetingDto
            {
                Id = meeting.Id,
                Title = meeting.Title ?? "Untitled Meeting",
                StartTime = meeting.StartTime,
                EndTime = meeting.EndTime,
                Agenda = meeting.Agenda ?? "",
                Color = meeting.Color ?? "#3b82f6",
                ProjectId = meeting.ProjectId,
                CreatedByUserId = meeting.CreatedByUserId,
                CreatedByFullName = meeting.CreatedBy?.FullName ?? "System",
                CreatedAt = meeting.CreatedAt,
                Participants = participantList
            });
        }

        [HttpPost]
        public async Task<ActionResult<MeetingDto>> CreateMeeting(CreateMeetingDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var validParticipants = (dto.Participants ?? new List<MeetingParticipantDto>()).Where(p => p != null).ToList();

            var meeting = new Meeting
            {
                Title = dto.Title ?? "New Meeting",
                StartTime = dto.StartTime.ToUniversalTime(),
                EndTime = dto.EndTime.ToUniversalTime(),
                Agenda = dto.Agenda ?? "",
                Color = dto.Color ?? "#3b82f6",
                ProjectId = dto.ProjectId,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                ParticipantsJson = JsonSerializer.Serialize(validParticipants)
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
                CreatedByFullName = User.FindFirstValue(ClaimTypes.Name) ?? "Admin",
                CreatedAt = meeting.CreatedAt,
                Participants = validParticipants
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

            var validParticipants = (dto.Participants ?? new List<MeetingParticipantDto>()).Where(p => p != null).ToList();

            meeting.Title = dto.Title ?? meeting.Title;
            meeting.StartTime = dto.StartTime.ToUniversalTime();
            meeting.EndTime = dto.EndTime.ToUniversalTime();
            meeting.Agenda = dto.Agenda ?? "";
            meeting.Color = dto.Color ?? meeting.Color;
            meeting.ProjectId = dto.ProjectId;
            meeting.UpdatedAt = DateTime.UtcNow;
            meeting.ParticipantsJson = JsonSerializer.Serialize(validParticipants);

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
        public List<MeetingParticipantDto> Participants { get; set; } = new List<MeetingParticipantDto>();
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