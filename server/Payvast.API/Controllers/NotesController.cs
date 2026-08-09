using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NoteDto>>> GetNotes()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var notes = await _context.Notes
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.UpdatedAt)
                .Select(n => new NoteDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Content = n.Content,
                    Category = n.Category,
                    UpdatedAt = n.UpdatedAt,
                    ReminderDate = n.ReminderDate,
                    // === شروع تغییرات ===
                    ReminderOffsetMinutes = n.ReminderOffsetMinutes
                    // === پایان تغییرات ===
                })
                .ToListAsync();
            return Ok(notes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NoteDto>> GetNote(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var note = await _context.Notes
                .Where(n => n.UserId == userId && n.Id == id)
                .Select(n => new NoteDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Content = n.Content,
                    Category = n.Category,
                    UpdatedAt = n.UpdatedAt,
                    ReminderDate = n.ReminderDate,
                    // === شروع تغییرات ===
                    ReminderOffsetMinutes = n.ReminderOffsetMinutes
                    // === پایان تغییرات ===
                })
                .FirstOrDefaultAsync();
            if (note == null) return NotFound();
            return Ok(note);
        }

        [HttpPost]
        public async Task<ActionResult<NoteDto>> CreateNote(CreateUpdateNoteDto createNoteDto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var note = new Note
            {
                Title = createNoteDto.Title,
                Content = createNoteDto.Content,
                Category = createNoteDto.Category,
                ReminderDate = createNoteDto.ReminderDate,
                // === شروع تغییرات ===
                ReminderOffsetMinutes = createNoteDto.ReminderOffsetMinutes,
                // === پایان تغییرات ===
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Notes.Add(note);
            await _context.SaveChangesAsync();
            
            // === اصلاح: DTO بازگشتی نیز باید کامل باشد ===
            var noteDto = new NoteDto 
            { 
                Id = note.Id, 
                Title = note.Title, 
                Content = note.Content, 
                Category = note.Category, 
                UpdatedAt = note.UpdatedAt, 
                ReminderDate = note.ReminderDate,
                ReminderOffsetMinutes = note.ReminderOffsetMinutes
            };
            return CreatedAtAction(nameof(GetNote), new { id = note.Id }, noteDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNote(int id, CreateUpdateNoteDto updateNoteDto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var note = await _context.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (note == null) return NotFound();

            note.Title = updateNoteDto.Title;
            note.Content = updateNoteDto.Content;
            note.Category = updateNoteDto.Category;
            note.ReminderDate = updateNoteDto.ReminderDate;
            // === شروع تغییرات ===
            note.ReminderOffsetMinutes = updateNoteDto.ReminderOffsetMinutes;
            note.ReminderSent = false; // با هر ویرایش، وضعیت ارسال ریمایندر را ریست می‌کنیم
            // === پایان تغییرات ===
            note.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var note = await _context.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (note == null) return NotFound();
            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}