using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Hubs;
using Payvast.API.Models;
using System.Linq;
using System.Collections.Generic;
using System;
using System.Threading.Tasks;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet("channels")]
        public async Task<IActionResult> GetUserChannels()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

                var myChannelMemberships = await _context.ChatChannelMembers
                    .Where(m => m.UserId == userId)
                    .Select(m => m.ChannelId)
                    .ToListAsync();

                var myChannels = await _context.ChatChannels
                    .Where(c => myChannelMemberships.Contains(c.Id))
                    .AsNoTracking()
                    .ToListAsync();

                var otherMembers = await _context.ChatChannelMembers
                    .Where(m => myChannelMemberships.Contains(m.ChannelId) && m.UserId != userId)
                    .Include(m => m.User)
                    .AsNoTracking()
                    .ToListAsync();

                var unreadCounts = await _context.UnreadMessages
                    .Where(um => um.UserId == userId)
                    .GroupBy(um => um.ChannelId)
                    .Select(g => new { ChannelId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.ChannelId, x => x.Count);

                var projectChannels = new List<object>();
                var directChannels = new List<object>();

                foreach (var channel in myChannels)
                {
                    unreadCounts.TryGetValue(channel.Id, out var unreadCount);

                    if (channel.ChannelType == "Project")
                    {
                        projectChannels.Add(new
                        {
                            channel.Id,
                            channel.Name,
                            channel.ChannelType,
                            UnreadCount = unreadCount
                        });
                    }
                    else
                    {
                        var otherMember = otherMembers.FirstOrDefault(m => m.ChannelId == channel.Id);
                        directChannels.Add(new
                        {
                            channel.Id,
                            Name = otherMember?.User?.FullName ?? "Deleted User",
                            AvatarUrl = otherMember?.User?.AvatarUrl,
                            ChannelType = "Direct",
                            UnreadCount = unreadCount
                        });
                    }
                }

                return Ok(new { projectChannels, directChannels });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatController] Error in GetUserChannels: {ex.Message}");
                return StatusCode(500, "Internal Server Error");
            }
        }

        [HttpPost("direct")]
        public async Task<IActionResult> GetOrCreateDirectChannel([FromBody] CreateDirectChatDto dto)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var otherUserId = dto.OtherUserId;

            if (currentUserId == otherUserId)
                return BadRequest("Cannot initiate a direct chat with yourself.");

            var myChannelIds = await _context.ChatChannelMembers
                .Where(m => m.UserId == currentUserId)
                .Select(m => m.ChannelId)
                .ToListAsync();

            var existingChannelId = await _context.ChatChannelMembers
                .Where(m => m.UserId == otherUserId && myChannelIds.Contains(m.ChannelId))
                .Select(m => m.ChannelId)
                .Join(_context.ChatChannels, id => id, c => c.Id, (id, c) => new { c.Id, c.ChannelType })
                .Where(x => x.ChannelType == "Direct")
                .Select(x => x.Id)
                .FirstOrDefaultAsync();

            if (existingChannelId != 0)
                return Ok(new { Id = existingChannelId });

            var newChannel = new ChatChannel
            {
                ChannelType = "Direct",
                IsPrivate = true,
                CreatedAt = DateTime.UtcNow,
                Name = "DirectChat"
            };

            _context.ChatChannels.Add(newChannel);
            await _context.SaveChangesAsync();

            _context.ChatChannelMembers.Add(new ChatChannelMember { UserId = currentUserId, ChannelId = newChannel.Id });
            _context.ChatChannelMembers.Add(new ChatChannelMember { UserId = otherUserId, ChannelId = newChannel.Id });
            
            await _context.SaveChangesAsync();

            return Ok(new { Id = newChannel.Id });
        }

        [HttpGet("channels/{channelId}/messages")]
        public async Task<IActionResult> GetChannelMessages(int channelId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var isMember = await _context.ChatChannelMembers
                .AnyAsync(m => m.UserId == userId && m.ChannelId == channelId);

            if (!isMember) return Forbid();

            var rawMessages = await _context.ChatMessages
                .Include(m => m.Sender)
                .Include(m => m.ReplyTo)
                .Where(m => m.ChannelId == channelId)
                .OrderBy(m => m.SentAt)
                .AsNoTracking()
                .ToListAsync();

            var messageIds = rawMessages.Select(m => m.Id).ToList();

            var reactionsGrouped = await _context.MessageReactions
                .Where(r => messageIds.Contains(r.MessageId))
                .AsNoTracking()
                .ToListAsync();

            var reactionsDict = reactionsGrouped
                .GroupBy(r => r.MessageId)
                .ToDictionary(
                    g => g.Key,
                    g => g.GroupBy(r => r.Reaction)
                          .Select(rg => (object)new { Reaction = rg.Key, Count = rg.Count() })
                          .ToList()
                );

            var messages = rawMessages.Select(m => new
            {
                m.Id,
                SenderId = m.Sender?.Id ?? 0,
                SenderFullName = m.Sender?.FullName ?? "Unknown User",
                SenderAvatarUrl = m.Sender?.AvatarUrl,
                m.Content,
                m.SentAt,
                m.EditedAt,
                m.SeenAt,
                ReplyToId = m.ReplyToId,
                RepliedContent = m.ReplyTo?.Content,
                m.Latitude,
                m.Longitude,
                Reactions = reactionsDict.TryGetValue(m.Id, out var reactionList) ? reactionList : new List<object>()
            }).ToList();

            var unreadEntries = await _context.UnreadMessages
                .Where(um => um.ChannelId == channelId && um.UserId == userId)
                .ToListAsync();
            
            if (unreadEntries.Any())
            {
                _context.UnreadMessages.RemoveRange(unreadEntries);
                await _context.SaveChangesAsync();
                await _hubContext.Clients.User(userId.ToString()).SendAsync("UpdateUnreadCount");
            }

            return Ok(messages);
        }
    }

    public class CreateDirectChatDto
    {
        public int OtherUserId { get; set; }
    }
}