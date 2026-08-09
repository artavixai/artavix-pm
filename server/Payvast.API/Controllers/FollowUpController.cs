using System.Security.Claims;
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
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FollowUpController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FollowUpController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<FollowUpDto>>> GetProjectFollowUps(int projectId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");

            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("پروژه یافت نشد.");

            if (!isAdmin && project.ProjectManagerId != userId)
                return Forbid();

            var followUps = await _context.ProjectFollowUps
                .Include(f => f.User)
                .Where(f => f.ProjectId == projectId)
                .OrderByDescending(f => f.FollowUpDate)
                .Select(f => new FollowUpDto
                {
                    Id = f.Id,
                    ProjectId = f.ProjectId,
                    UserId = f.UserId,
                    UserFullName = f.User.FullName,
                    Content = f.Content,
                    FollowUpDate = f.FollowUpDate,
                    IsResolved = f.IsResolved,
                    CreatedAt = f.CreatedAt,
                    ReminderDate = f.ReminderDate,
                    ReminderSent = f.ReminderSent
                })
                .ToListAsync();

            return Ok(followUps);
        }

        [HttpPost]
        public async Task<ActionResult<FollowUpDto>> CreateFollowUp(CreateFollowUpDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");

            var project = await _context.Projects.FindAsync(dto.ProjectId);
            if (project == null) return NotFound("پروژه یافت نشد.");

            if (!isAdmin && project.ProjectManagerId != userId)
                return Forbid();

            var followUp = new ProjectFollowUp
            {
                ProjectId = dto.ProjectId,
                UserId = userId,
                Content = dto.Content,
                FollowUpDate = dto.FollowUpDate.ToUniversalTime(),
                IsResolved = dto.IsResolved,
                CreatedAt = DateTime.UtcNow,
                ReminderDate = dto.ReminderDate?.ToUniversalTime(),
                ReminderSent = false
            };

            _context.ProjectFollowUps.Add(followUp);
            await _context.SaveChangesAsync();

            var result = new FollowUpDto
            {
                Id = followUp.Id,
                ProjectId = followUp.ProjectId,
                UserId = followUp.UserId,
                UserFullName = (await _context.Users.FindAsync(userId)).FullName,
                Content = followUp.Content,
                FollowUpDate = followUp.FollowUpDate,
                IsResolved = followUp.IsResolved,
                CreatedAt = followUp.CreatedAt,
                ReminderDate = followUp.ReminderDate,
                ReminderSent = followUp.ReminderSent
            };

            return CreatedAtAction(nameof(GetProjectFollowUps), new { projectId = followUp.ProjectId }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFollowUp(int id, UpdateFollowUpDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");

            var followUp = await _context.ProjectFollowUps.FindAsync(id);
            if (followUp == null) return NotFound();

            var project = await _context.Projects.FindAsync(followUp.ProjectId);
            if (project == null) return NotFound();

            if (!isAdmin && project.ProjectManagerId != userId && followUp.UserId != userId)
                return Forbid();

            followUp.Content = dto.Content;
            followUp.FollowUpDate = dto.FollowUpDate.ToUniversalTime();
            followUp.IsResolved = dto.IsResolved;
            followUp.ReminderDate = dto.ReminderDate?.ToUniversalTime();
            followUp.ReminderSent = false; // در صورت تغییر تاریخ یادآوری، دوباره ارسال شود

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFollowUp(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");

            var followUp = await _context.ProjectFollowUps.FindAsync(id);
            if (followUp == null) return NotFound();

            var project = await _context.Projects.FindAsync(followUp.ProjectId);
            if (project == null) return NotFound();

            if (!isAdmin && project.ProjectManagerId != userId && followUp.UserId != userId)
                return Forbid();

            _context.ProjectFollowUps.Remove(followUp);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}