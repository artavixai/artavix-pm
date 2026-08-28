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
            context.Database.EnsureCreated();

            // 1. Seed Default Roles
            if (!context.Roles.Any())
            {
                var roles = new Role[]
                {
                    new Role { Name = "SuperAdmin", Description = "Full administrative access to all system modules and settings" },
                    new Role { Name = "ProjectManager", Description = "Project manager with full rights to create and manage projects" },
                    new Role { Name = "TeamMember", Description = "Team member with access to assigned tasks and workspace" }
                };
                context.Roles.AddRange(roles);
                context.SaveChanges();
            }

            // 2. Ensure Admin User
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
            }
            else
            {
                adminUser.IsActive = true;
                context.SaveChanges();
            }

            // 3. Ensure Default Product Groups if empty
            if (!context.ProductGroups.Any())
            {
                var pg1 = new ProductGroup { Name = "Financial", Color = "#ef4444" };
                var pg2 = new ProductGroup { Name = "Administrative", Color = "#3b82f6" };
                var pg3 = new ProductGroup { Name = "HR & Payroll", Color = "#10b981" };
                var pg4 = new ProductGroup { Name = "Process & Forms", Color = "#8b5cf6" };
                context.ProductGroups.AddRange(pg1, pg2, pg3, pg4);
                context.SaveChanges();

                // Subsystems
                var sub1 = new Subsystem { Name = "General Accounting", ProductGroupId = pg1.Id };
                var sub2 = new Subsystem { Name = "Treasury & Banking", ProductGroupId = pg1.Id };
                var sub3 = new Subsystem { Name = "Personnel & Staff", ProductGroupId = pg3.Id };
                context.Subsystems.AddRange(sub1, sub2, sub3);
                context.SaveChanges();

                // Task Templates
                context.TaskTemplates.AddRange(
                    new TaskTemplate { Title = "Initial System Setup", DefaultDurationInDays = 3, DefaultWeight = 30, SubsystemId = sub1.Id },
                    new TaskTemplate { Title = "Chart of Accounts Configuration", DefaultDurationInDays = 2, DefaultWeight = 40, SubsystemId = sub1.Id },
                    new TaskTemplate { Title = "Bank Gateway & Cheque Setup", DefaultDurationInDays = 2, DefaultWeight = 50, SubsystemId = sub2.Id }
                );
                context.SaveChanges();

                // Step Templates
                context.ProjectStepTemplates.AddRange(
                    new ProjectStepTemplate { ProductGroupId = pg1.Id, StepName = "Requirements Analysis", DisplayOrder = 1, IsActive = true },
                    new ProjectStepTemplate { ProductGroupId = pg1.Id, StepName = "System Setup & Config", DisplayOrder = 2, IsActive = true },
                    new ProjectStepTemplate { ProductGroupId = pg1.Id, StepName = "Data Migration", DisplayOrder = 3, IsActive = true },
                    new ProjectStepTemplate { ProductGroupId = pg1.Id, StepName = "User Training", DisplayOrder = 4, IsActive = true },
                    new ProjectStepTemplate { ProductGroupId = pg1.Id, StepName = "Final Acceptance & Delivery", DisplayOrder = 5, IsActive = true }
                );
                context.SaveChanges();
            }

            // 4. Ensure Form & Report Templates
            if (!context.FormTemplates.Any())
            {
                var ft1 = new FormTemplate { Name = "Financial Systems Deployment", Color = "#ef4444", DefaultSessionsCount = 5, IsActive = true };
                var ft2 = new FormTemplate { Name = "Administrative Automation", Color = "#3b82f6", DefaultSessionsCount = 4, IsActive = true };
                context.FormTemplates.AddRange(ft1, ft2);
                context.SaveChanges();

                context.FormStepTemplates.AddRange(
                    new FormStepTemplate { FormTemplateId = ft1.Id, StepName = "Initial Setup", StepOrder = 1, RequiredSessions = 1, DefaultHoursPerSession = 4 },
                    new FormStepTemplate { FormTemplateId = ft1.Id, StepName = "Configuration", StepOrder = 2, RequiredSessions = 2, DefaultHoursPerSession = 4 },
                    new FormStepTemplate { FormTemplateId = ft1.Id, StepName = "Testing & QA", StepOrder = 3, RequiredSessions = 2, DefaultHoursPerSession = 4 }
                );
                context.SaveChanges();
            }

            if (!context.ReportTemplates.Any())
            {
                var rt1 = new ReportTemplate { Name = "Standard Financial Reporting", Color = "#f97316", DefaultSessionsCount = 3, IsActive = true };
                context.ReportTemplates.Add(rt1);
                context.SaveChanges();

                context.ReportStepTemplates.AddRange(
                    new ReportStepTemplate { ReportTemplateId = rt1.Id, StepName = "Design & Layout", StepOrder = 1, RequiredSessions = 1, DefaultHoursPerSession = 4 },
                    new ReportStepTemplate { ReportTemplateId = rt1.Id, StepName = "Data Binding & Output", StepOrder = 2, RequiredSessions = 2, DefaultHoursPerSession = 4 }
                );
                context.SaveChanges();
            }

            // 5. Seed Public Chat Channel
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