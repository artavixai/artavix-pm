using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.Models;
using Payvast.API.Services;
using System.Linq;
using System.Collections.Generic;
using System;

namespace Payvast.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly PresenceTracker _tracker;

        public ChatHub(ApplicationDbContext context, PresenceTracker tracker)
        {
            _context = context;
            _tracker = tracker;
        }

        public async System.Threading.Tasks.Task JoinChannel(int channelId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channelId.ToString());
            await MarkMessagesAsSeen(channelId);
        }

        // متد اصلی ارسال پیام متنی (با قابلیت ریپلای)
        public async System.Threading.Tasks.Task SendMessage(int channelId, string message, long? replyToId = null)
        {
            var userIdStr = Context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return;
            var userId = int.Parse(userIdStr);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return;

            var chatMessage = new ChatMessage
            {
                ChannelId = channelId,
                SenderId = userId,
                Content = message,
                SentAt = DateTime.UtcNow,
                ReplyToId = replyToId
            };

            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();

            var members = await _context.ChatChannelMembers
                .Where(m => m.ChannelId == channelId && m.UserId != userId)
                .ToListAsync();

            var unreadEntries = members.Select(m => new UnreadMessage
            {
                ChannelId = channelId,
                UserId = m.UserId,
                MessageId = chatMessage.Id
            }).ToList();

            if (unreadEntries.Any())
            {
                await _context.UnreadMessages.AddRangeAsync(unreadEntries);
                await _context.SaveChangesAsync();
            }

            string repliedText = null;
            if (replyToId.HasValue)
            {
                repliedText = await _context.ChatMessages
                    .Where(m => m.Id == replyToId.Value)
                    .Select(m => m.Content)
                    .FirstOrDefaultAsync();
            }

            var messageDto = new {
                Id = chatMessage.Id,
                ChannelId = channelId,
                SenderId = user.Id,
                SenderFullName = user.FullName,
                SenderAvatarUrl = user.AvatarUrl,
                Content = chatMessage.Content,
                SentAt = chatMessage.SentAt,
                ReplyToId = replyToId,
                RepliedContent = repliedText,
                Reactions = new List<object>(),
                SeenAt = (DateTime?)null,
                Latitude = (double?)null,
                Longitude = (double?)null
            };

            await Clients.Group(channelId.ToString()).SendAsync("ReceiveMessage", messageDto);

            foreach (var member in members)
                await Clients.User(member.UserId.ToString()).SendAsync("UpdateUnreadCount");
        }

        // متد جدید برای ارسال لوکیشن
        public async System.Threading.Tasks.Task SendLocation(int channelId, double latitude, double longitude)
        {
            var userIdStr = Context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return;
            var userId = int.Parse(userIdStr);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return;

            var chatMessage = new ChatMessage
            {
                ChannelId = channelId,
                SenderId = userId,
                Content = "موقعیت مکانی",
                SentAt = DateTime.UtcNow,
                Latitude = latitude,
                Longitude = longitude
            };

            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();

            var members = await _context.ChatChannelMembers
                .Where(m => m.ChannelId == channelId && m.UserId != userId)
                .ToListAsync();

            var unreadEntries = members.Select(m => new UnreadMessage
            {
                ChannelId = channelId,
                UserId = m.UserId,
                MessageId = chatMessage.Id
            }).ToList();

            if (unreadEntries.Any())
            {
                await _context.UnreadMessages.AddRangeAsync(unreadEntries);
                await _context.SaveChangesAsync();
            }

            var messageDto = new {
                Id = chatMessage.Id,
                ChannelId = channelId,
                SenderId = user.Id,
                SenderFullName = user.FullName,
                SenderAvatarUrl = user.AvatarUrl,
                Content = chatMessage.Content,
                SentAt = chatMessage.SentAt,
                ReplyToId = (long?)null,
                RepliedContent = (string)null,
                Reactions = new List<object>(),
                SeenAt = (DateTime?)null,
                Latitude = latitude,
                Longitude = longitude
            };

            await Clients.Group(channelId.ToString()).SendAsync("ReceiveMessage", messageDto);

            foreach (var member in members)
                await Clients.User(member.UserId.ToString()).SendAsync("UpdateUnreadCount");
        }

        public async System.Threading.Tasks.Task EditMessage(long messageId, string newContent)
        {
            var userId = int.Parse(Context.User.FindFirstValue(ClaimTypes.NameIdentifier));
            var message = await _context.ChatMessages.FirstOrDefaultAsync(m => m.Id == messageId && m.SenderId == userId);
            
            if (message != null)
            {
                message.Content = newContent;
                message.EditedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await Clients.Group(message.ChannelId.ToString()).SendAsync("MessageEdited", new { 
                    MessageId = messageId, 
                    Content = newContent, 
                    EditedAt = message.EditedAt 
                });
            }
        }

        public async System.Threading.Tasks.Task ToggleReaction(long messageId, string reaction)
        {
            try 
            {
                var userIdStr = Context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr)) return;
                var userId = int.Parse(userIdStr);

                var message = await _context.ChatMessages.FindAsync(messageId);
                if (message == null) return;

                var existingReaction = await _context.MessageReactions
                    .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId && r.Reaction == reaction);

                if (existingReaction != null)
                {
                    _context.MessageReactions.Remove(existingReaction);
                }
                else
                {
                    _context.MessageReactions.Add(new MessageReaction 
                    { 
                        MessageId = messageId, 
                        UserId = userId, 
                        Reaction = reaction 
                    });
                }

                await _context.SaveChangesAsync();
                
                var reactionsGrouped = await _context.MessageReactions
                    .Where(r => r.MessageId == messageId)
                    .GroupBy(r => r.Reaction)
                    .Select(g => new { 
                        Reaction = g.Key, 
                        Count = g.Count() 
                    })
                    .ToListAsync();
                
                await Clients.Group(message.ChannelId.ToString()).SendAsync("UpdateMessageReactions", new { 
                    MessageId = messageId, 
                    Reactions = reactionsGrouped 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ToggleReaction: {ex.Message}");
                throw new HubException("An error occurred while processing the reaction.");
            }
        }

        public async System.Threading.Tasks.Task DeleteMessage(long messageId, bool deleteForEveryone)
        {
            try
            {
                var userIdStr = Context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr)) return;
                var userId = int.Parse(userIdStr);

                var message = await _context.ChatMessages.FirstOrDefaultAsync(m => m.Id == messageId);
                if (message == null || message.SenderId != userId) return;

                // ۱. پاکسازی وابستگی‌ها برای جلوگیری از خطای Foreign Key Constraint در EF Core
                
                // پاک کردن ری‌اکشن‌ها
                var reactions = await _context.MessageReactions.Where(r => r.MessageId == messageId).ToListAsync();
                if (reactions.Any()) _context.MessageReactions.RemoveRange(reactions);

                // پاک کردن نشانه‌های پیام خوانده نشده
                var unreads = await _context.UnreadMessages.Where(u => u.MessageId == messageId).ToListAsync();
                if (unreads.Any()) _context.UnreadMessages.RemoveRange(unreads);

                // حذف ارجاع به این پیام از پیام‌هایی که ریپلای کرده‌اند
                var replies = await _context.ChatMessages.Where(m => m.ReplyToId == messageId).ToListAsync();
                foreach (var reply in replies)
                {
                    reply.ReplyToId = null;
                }

                // ۲. حذف نهایی پیام
                _context.ChatMessages.Remove(message);
                await _context.SaveChangesAsync();

                if (deleteForEveryone)
                {
                    await Clients.Group(message.ChannelId.ToString()).SendAsync("MessageDeleted", messageId);
                }
                else
                {
                    await Clients.Caller.SendAsync("MessageDeleted", messageId);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeleteMessage: {ex.Message}");
                throw new HubException("خطا در حذف پیام از سرور.");
            }
        }

        public async System.Threading.Tasks.Task MarkMessagesAsSeen(int channelId)
        {
            var userIdStr = Context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return;
            var userId = int.Parse(userIdStr);
            
            var unreads = await _context.UnreadMessages
                .Where(um => um.ChannelId == channelId && um.UserId == userId)
                .ToListAsync();
            
            _context.UnreadMessages.RemoveRange(unreads);
            
            var now = DateTime.UtcNow;
            var otherMessages = await _context.ChatMessages
                .Where(m => m.ChannelId == channelId && m.SenderId != userId && m.SeenAt == null)
                .ToListAsync();
            
            foreach(var msg in otherMessages) msg.SeenAt = now;
            
            await _context.SaveChangesAsync();
            
            await Clients.Group(channelId.ToString()).SendAsync("MessagesSeen", new { 
                ChannelId = channelId, 
                SeenByUserId = userId, 
                SeenAt = now 
            });

            await Clients.Caller.SendAsync("UpdateUnreadCount");
        }

        public override async System.Threading.Tasks.Task OnConnectedAsync()
        {
            var userIdStr = Context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return;
            var userId = int.Parse(userIdStr);
            
            var isOnline = await _tracker.UserConnected(userId, Context.ConnectionId);
            if(isOnline) await Clients.Others.SendAsync("UserIsOnline", userId);
        }
    }
}