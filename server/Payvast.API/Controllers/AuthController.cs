using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using Payvast.API.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace Payvast.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly TokenService _tokenService;

        public AuthController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _tokenService = new TokenService(config);
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
        {
            if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
                return BadRequest("This username is already registered.");

            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
                return BadRequest("This email address is already registered.");

            var user = new User
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                FullName = registerDto.FullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "TeamMember");
            if (defaultRole == null)
            {
                return StatusCode(500, "Default user role was not found in database.");
            }

            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleId = defaultRole.Id
            };

            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();

            var token = _tokenService.CreateToken(user, new List<string> { "TeamMember" });
            return Ok(new AuthResponseDto { Username = user.Username, Token = token });
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            Console.WriteLine($"[AUTH] Login attempt for username: '{loginDto.Username}'");

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username == loginDto.Username);

            if (user == null)
            {
                Console.WriteLine($"[AUTH ERROR] User '{loginDto.Username}' not found in database.");
                return Unauthorized(new { message = "Invalid username or password." });
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
            Console.WriteLine($"[AUTH RESULT] User '{user.Username}' (Id: {user.Id}) password verification: {isPasswordValid}");

            if (!isPasswordValid)
            {
                Console.WriteLine($"[AUTH ERROR] Password verification failed for user '{loginDto.Username}'.");
                return Unauthorized(new { message = "Invalid username or password." });
            }

            var roleNames = await (from ur in _context.UserRoles
                                   join r in _context.Roles on ur.RoleId equals r.Id
                                   where ur.UserId == user.Id
                                   select r.Name).ToListAsync();

            var token = _tokenService.CreateToken(user, roleNames);
            Console.WriteLine($"[AUTH SUCCESS] Token generated successfully for user '{user.Username}'.");

            return Ok(new AuthResponseDto { Username = user.Username, Token = token });
        }
    }
}