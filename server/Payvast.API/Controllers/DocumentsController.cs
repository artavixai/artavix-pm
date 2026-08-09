using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.Models;
using Payvast.API.DTOs;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/projects/{projectId}/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public DocumentsController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/projects/5/documents
        [HttpGet]
        public async Task<IActionResult> GetDocuments(int projectId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("پروژه یافت نشد.");

            // بررسی دسترسی: فقط مدیر پروژه یا ادمین
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");
            if (!isAdmin && project.ProjectManagerId != userId)
                return Forbid();

            var docs = await _context.ProjectDocuments
                .Where(d => d.ProjectId == projectId)
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new
                {
                    d.Id,
                    d.OriginalFileName,
                    d.FileSize,
                    d.ContentType,
                    d.UploadedAt,
                    d.Description,
                    UploadedBy = d.UploadedBy.FullName
                })
                .ToListAsync();

            return Ok(docs);
        }

        // POST: api/projects/5/documents
        [HttpPost]
        public async Task<IActionResult> UploadDocument(int projectId, [FromForm] UploadDocumentDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("پروژه یافت نشد.");

            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");
            if (!isAdmin && project.ProjectManagerId != userId)
                return Forbid();

            if (dto.File == null || dto.File.Length == 0)
                return BadRequest("فایلی انتخاب نشده است.");

            var uploadsFolder = Path.Combine(_env.WebRootPath, "documents", projectId.ToString());
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.File.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
            var relativePath = $"documents/{projectId}/{uniqueFileName}";

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.File.CopyToAsync(stream);
            }

            var document = new ProjectDocument
            {
                ProjectId = projectId,
                FileName = uniqueFileName,
                OriginalFileName = dto.File.FileName,
                FileSize = dto.File.Length,
                FilePath = relativePath,
                ContentType = dto.File.ContentType,
                UploadedByUserId = userId,
                UploadedAt = DateTime.UtcNow,
                Description = dto.Description
            };

            _context.ProjectDocuments.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                document.Id,
                document.OriginalFileName,
                document.FileSize,
                document.ContentType,
                document.UploadedAt,
                document.Description,
                UploadedBy = (await _context.Users.FindAsync(userId)).FullName
            });
        }

        // GET: api/projects/5/documents/1/download
        [HttpGet("{documentId}/download")]
        public async Task<IActionResult> DownloadDocument(int projectId, int documentId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var doc = await _context.ProjectDocuments
                .FirstOrDefaultAsync(d => d.Id == documentId && d.ProjectId == projectId);
            if (doc == null) return NotFound();

            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound();

            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");
            if (!isAdmin && project.ProjectManagerId != userId)
                return Forbid();

            var fullPath = Path.Combine(_env.WebRootPath, doc.FilePath);
            if (!System.IO.File.Exists(fullPath))
                return NotFound("فایل در سرور یافت نشد.");

            var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
            return File(fileBytes, doc.ContentType, doc.OriginalFileName);
        }

        // DELETE: api/projects/5/documents/1
        [HttpDelete("{documentId}")]
        public async Task<IActionResult> DeleteDocument(int projectId, int documentId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var doc = await _context.ProjectDocuments
                .FirstOrDefaultAsync(d => d.Id == documentId && d.ProjectId == projectId);
            if (doc == null) return NotFound();

            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound();

            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");
            if (!isAdmin && project.ProjectManagerId != userId)
                return Forbid();

            var fullPath = Path.Combine(_env.WebRootPath, doc.FilePath);
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);

            _context.ProjectDocuments.Remove(doc);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class UploadDocumentDto
    {
        public IFormFile File { get; set; }
        public string Description { get; set; }
    }
}