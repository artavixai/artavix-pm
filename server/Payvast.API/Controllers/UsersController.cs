using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Payvast.API.Services;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PresenceTracker _presenceTracker;

        public UsersController(ApplicationDbContext context, PresenceTracker presenceTracker)
        {
            _context = context;
            _presenceTracker = presenceTracker;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            try
            {
                var usersWithRoles = await _context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .OrderBy(u => u.FullName)
                    .ToListAsync();

                var userDtos = usersWithRoles.Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FullName = u.FullName,
                    Email = u.Email,
                    JobTitle = u.JobTitle,
                    PhoneNumber = u.PhoneNumber,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    AvatarUrl = u.AvatarUrl,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
                    MonthlyCapacityHours = u.MonthlyCapacityHours,
                    DailyCapacityHours = u.DailyCapacityHours
                }).ToList();

                return Ok(userDtos);
            }
            catch (Exception ex)
            {
                // لاگ کردن خطا در کنسول سرور برای عیب‌یابی
                Console.WriteLine($"Error in GetUsers: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                
                return StatusCode(500, "خطای داخلی سرور در زمان دریافت لیست کاربران. احتمالاً دیتابیس به‌روز نیست.");
            }
        }
        
        [HttpGet("colleagues")]
        public async Task<ActionResult<IEnumerable<ColleagueDto>>> GetColleagues()
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var onlineUserIds = await _presenceTracker.GetOnlineUserIds();

            var colleagues = await _context.Users
                .Where(u => u.IsActive && u.Id != currentUserId)
                .OrderBy(u => u.FullName)
                .Select(u => new ColleagueDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    AvatarUrl = u.AvatarUrl,
                    IsOnline = onlineUserIds.Contains(u.Id)
                }).ToListAsync();
            
            return Ok(colleagues);
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser([FromForm] CreateUserDto createUserDto)
        {
            if (await _context.Users.AnyAsync(u => u.Username == createUserDto.Username || u.Email == createUserDto.Email))
            {
                return BadRequest("نام کاربری یا ایمیل تکراری است.");
            }

            var roles = await _context.Roles.Where(r => createUserDto.RoleIds.Contains(r.Id)).ToListAsync();
            if (roles.Count != createUserDto.RoleIds.Count)
            {
                return BadRequest("یک یا چند نقش نامعتبر است.");
            }
            
            string avatarUrl = null;
            if (createUserDto.AvatarFile != null)
            {
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(createUserDto.AvatarFile.FileName);
                var filePath = Path.Combine("wwwroot/avatars", fileName);
                Directory.CreateDirectory(Path.GetDirectoryName(filePath));
                await using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await createUserDto.AvatarFile.CopyToAsync(stream);
                }
                avatarUrl = $"avatars/{fileName}";
            }

            var user = new User
            {
                Username = createUserDto.Username,
                FullName = createUserDto.FullName,
                Email = createUserDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
                JobTitle = createUserDto.JobTitle,
                PhoneNumber = createUserDto.PhoneNumber,
                IsActive = createUserDto.IsActive,
                AvatarUrl = avatarUrl,
                CreatedAt = DateTime.UtcNow,
                MonthlyCapacityHours = 198,
                DailyCapacityHours = 9
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            foreach (var role in roles)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            }
            await _context.SaveChangesAsync();
            
            return Ok(new UserDto { Id = user.Id, FullName = user.FullName });
        }
        
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromForm] UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound("کاربر یافت نشد.");

            if (updateUserDto.AvatarFile != null)
            {
                 if (!string.IsNullOrEmpty(user.AvatarUrl))
                {
                    var oldPath = Path.Combine("wwwroot", user.AvatarUrl.Replace('/', Path.DirectorySeparatorChar));
                    if (System.IO.File.Exists(oldPath))
                    {
                        System.IO.File.Delete(oldPath);
                    }
                }
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(updateUserDto.AvatarFile.FileName);
                var filePath = Path.Combine("wwwroot/avatars", fileName);
                Directory.CreateDirectory(Path.GetDirectoryName(filePath));
                await using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await updateUserDto.AvatarFile.CopyToAsync(stream);
                }
                user.AvatarUrl = $"avatars/{fileName}";
            }

            user.FullName = updateUserDto.FullName;
            user.Email = updateUserDto.Email;
            user.JobTitle = updateUserDto.JobTitle;
            user.PhoneNumber = updateUserDto.PhoneNumber;
            user.IsActive = updateUserDto.IsActive;

            user.UserRoles.Clear();
            if (updateUserDto.RoleIds != null && updateUserDto.RoleIds.Any())
            {
                var rolesToAdd = await _context.Roles.Where(r => updateUserDto.RoleIds.Contains(r.Id)).ToListAsync();
                foreach(var role in rolesToAdd)
                {
                    user.UserRoles.Add(new UserRole { Role = role });
                }
            }

            if (!string.IsNullOrEmpty(updateUserDto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateUserDto.Password);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/capacity")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> UpdateCapacity(int id, [FromBody] UpdateCapacityDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.MonthlyCapacityHours = dto.MonthlyCapacityHours;
            user.DailyCapacityHours = dto.DailyCapacityHours;

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("کاربر یافت نشد.");
            user.IsActive = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
    
    public class UpdateUserDto
    {
        [Required]
        public string FullName { get; set; }
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        public string JobTitle { get; set; }
        [Required]
        public string PhoneNumber { get; set; }
        public string Password { get; set; }
        public bool IsActive { get; set; }
        [Required]
        public List<int> RoleIds { get; set; }
        public IFormFile AvatarFile { get; set; }
    }
    
    public class ColleagueDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string AvatarUrl { get; set; }
        public bool IsOnline { get; set; }
    }

    public class UpdateCapacityDto 
    { 
        public int MonthlyCapacityHours { get; set; } 
        public int DailyCapacityHours { get; set; }
    }
}