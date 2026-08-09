using Microsoft.EntityFrameworkCore;
using Payvast.API.Models;
using System.Linq;
using System;
using System.Collections.Generic;

namespace Payvast.API.Data
{
    public static class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context)
        {
            // Seed Default Roles in English
            if (!context.Roles.Any())
            {
                var roles = new Role[]
                {
                    new Role { Name = "SuperAdmin", Description = "Full administrative access to all system modules and settings" },
                    new Role { Name = "ProjectManager", Description = "Project manager with full rights to create and manage projects" },
                    new Role { Name = "TeamMember", Description = "Team member with access to assigned tasks and workspace" }
                };
                foreach (Role r in roles)
                {
                    context.Roles.Add(r);
                }
                context.SaveChanges();
            }

            // Always ensure admin user exists with password admin123
            var adminUser = context.Users.FirstOrDefault(u => u.Username == "admin");
            if (adminUser == null)
            {
                adminUser = new User
                {
                    Username = "admin",
                    FullName = "Artavix Administrator",
                    Email = "admin@artavix.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    MonthlyCapacityHours = 198,
                    DailyCapacityHours = 9
                };
                context.Users.Add(adminUser);
                context.SaveChanges();

                var superAdminRole = context.Roles.FirstOrDefault(r => r.Name == "SuperAdmin");
                if (superAdminRole != null)
                {
                    context.UserRoles.Add(new UserRole
                    {
                        UserId = adminUser.Id,
                        RoleId = superAdminRole.Id
                    });
                    context.SaveChanges();
                }
                Console.WriteLine("==================================================");
                Console.WriteLine("[DbInitializer] Created Artavix PM admin user (Username: admin, Password: admin123)");
                Console.WriteLine("==================================================");
            }
            else
            {
                adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123");
                adminUser.IsActive = true;
                context.SaveChanges();
                Console.WriteLine("==================================================");
                Console.WriteLine("[DbInitializer] Verified Artavix PM admin user credentials (admin/admin123)");
                Console.WriteLine("==================================================");
            }

            // Seed Default Public Chat Channel in English
            if (!context.ChatChannels.Any(c => c.Name == "General"))
            {
                var generalChannel = new ChatChannel
                {
                    Name = "General",
                    IsPrivate = false,
                    CreatedAt = DateTime.UtcNow,
                    ChannelType = "Public"
                };
                context.ChatChannels.Add(generalChannel);
                context.SaveChanges();

                var userIds = context.Users.Select(u => u.Id).ToList();
                foreach (var userId in userIds)
                {
                    if (!context.ChatChannelMembers.Any(m => m.UserId == userId && m.ChannelId == generalChannel.Id))
                    {
                        context.ChatChannelMembers.Add(new ChatChannelMember { UserId = userId, ChannelId = generalChannel.Id });
                    }
                }
                context.SaveChanges();
            }
        }
    }
}