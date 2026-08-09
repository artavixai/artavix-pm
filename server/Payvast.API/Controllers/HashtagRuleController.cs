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
    [Authorize(Roles = "SuperAdmin")]
    [ApiController]
    [Route("api/[controller]s")]  // <-- اصلاح کلیدی: اضافه شدن 's' برای تطابق با فرانت‌اند
    public class HashtagRuleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HashtagRuleController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HashtagRuleDto>>> GetAll()
        {
            var rules = await _context.HashtagRules
                .OrderBy(r => r.Hashtag)
                .Select(r => new HashtagRuleDto
                {
                    Id = r.Id,
                    Hashtag = r.Hashtag,
                    TargetType = r.TargetType,
                    TargetValue = r.TargetValue
                })
                .ToListAsync();
            return Ok(rules);
        }

        [HttpPost]
        public async Task<ActionResult<HashtagRuleDto>> Create(CreateHashtagRuleDto dto)
        {
            var rule = new HashtagRule
            {
                Hashtag = dto.Hashtag,
                TargetType = dto.TargetType,
                TargetValue = dto.TargetValue,
                CreatedAt = DateTime.UtcNow
            };
            _context.HashtagRules.Add(rule);
            await _context.SaveChangesAsync();

            return Ok(new HashtagRuleDto
            {
                Id = rule.Id,
                Hashtag = rule.Hashtag,
                TargetType = rule.TargetType,
                TargetValue = rule.TargetValue
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var rule = await _context.HashtagRules.FindAsync(id);
            if (rule == null) return NotFound();
            _context.HashtagRules.Remove(rule);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}