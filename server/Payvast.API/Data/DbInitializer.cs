using Microsoft.EntityFrameworkCore;
using Payvast.API.Models;
using System.Linq;
using System;
using System.Collections.Generic;
using TaskModel = Payvast.API.Models.Task;

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

            var superAdminRole = context.Roles.FirstOrDefault(r => r.Name == "SuperAdmin");
            var pmRole = context.Roles.FirstOrDefault(r => r.Name == "ProjectManager");
            var memberRole = context.Roles.FirstOrDefault(r => r.Name == "TeamMember");

            // 2. Ensure Default Users
            var defaultUsers = new List<(string username, string fullName, string email, string jobTitle, int daily, int monthly, Role role)>
            {
                ("admin", "Artavix Administrator", "admin@artavix.com", "System Director", 9, 198, superAdminRole),
                ("amin.mousavi", "Amin Mousavi", "amin@artavix.com", "Senior Project Manager", 9, 198, pmRole),
                ("sara.ahmadi", "Sara Ahmadi", "sara@artavix.com", "Senior Systems Specialist", 8, 176, memberRole),
                ("reza.mohammadi", "Reza Mohammadi", "reza@artavix.com", "Financial Systems Architect", 8, 176, memberRole),
                ("ali.karimi", "Ali Karimi", "ali@artavix.com", "Integration Engineer", 8, 176, memberRole),
                ("maryam.hosseini", "Maryam Hosseini", "maryam@artavix.com", "QA & Processes Lead", 8, 176, memberRole)
            };

            foreach (var item in defaultUsers)
            {
                var existingUser = context.Users.FirstOrDefault(u => u.Username == item.username);
                if (existingUser == null)
                {
                    var newUser = new User
                    {
                        Username = item.username,
                        FullName = item.fullName,
                        Email = item.email,
                        JobTitle = item.jobTitle,
                        PhoneNumber = "09120000000",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        MonthlyCapacityHours = item.monthly,
                        DailyCapacityHours = item.daily
                    };
                    context.Users.Add(newUser);
                    context.SaveChanges();

                    if (item.role != null)
                    {
                        context.UserRoles.Add(new UserRole
                        {
                            UserId = newUser.Id,
                            RoleId = item.role.Id
                        });
                        context.SaveChanges();
                    }
                }
            }

            var adminUser = context.Users.First(u => u.Username == "admin");
            var pmUser = context.Users.FirstOrDefault(u => u.Username == "amin.mousavi") ?? adminUser;
            var specialistUser = context.Users.FirstOrDefault(u => u.Username == "sara.ahmadi") ?? adminUser;

            // 3. Ensure Product Groups & Subsystems
            if (!context.ProductGroups.Any())
            {
                var pg1 = new ProductGroup { Name = "Financial", Color = "#ef4444" };
                var pg2 = new ProductGroup { Name = "Administrative", Color = "#3b82f6" };
                var pg3 = new ProductGroup { Name = "HR & Payroll", Color = "#10b981" };
                var pg4 = new ProductGroup { Name = "Process & Forms", Color = "#8b5cf6" };
                context.ProductGroups.AddRange(pg1, pg2, pg3, pg4);
                context.SaveChanges();

                var sub1 = new Subsystem { Name = "General Accounting", ProductGroupId = pg1.Id };
                var sub2 = new Subsystem { Name = "Treasury & Banking", ProductGroupId = pg1.Id };
                var sub3 = new Subsystem { Name = "Personnel & Staff", ProductGroupId = pg3.Id };
                var sub4 = new Subsystem { Name = "Workflow Engine", ProductGroupId = pg4.Id };
                context.Subsystems.AddRange(sub1, sub2, sub3, sub4);
                context.SaveChanges();

                context.TaskTemplates.AddRange(
                    new TaskTemplate { Title = "Initial System Setup", DefaultDurationInDays = 3, DefaultWeight = 30, SubsystemId = sub1.Id },
                    new TaskTemplate { Title = "Chart of Accounts Configuration", DefaultDurationInDays = 2, DefaultWeight = 40, SubsystemId = sub1.Id },
                    new TaskTemplate { Title = "Bank Gateway & Cheque Setup", DefaultDurationInDays = 2, DefaultWeight = 50, SubsystemId = sub2.Id },
                    new TaskTemplate { Title = "Personnel File Structuring", DefaultDurationInDays = 3, DefaultWeight = 50, SubsystemId = sub3.Id }
                );
                context.SaveChanges();

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

            // 5. Ensure Projects & Gantt Tasks if empty
            if (!context.Projects.Any())
            {
                var now = DateTime.UtcNow;

                var p1 = new Project
                {
                    Title = "Enterprise Financial Master Rollout",
                    CrmCode = "CRM-1024",
                    BuyerName = "Petro Pars Holding",
                    ProjectManagerId = pmUser.Id,
                    ProjectAssigneeId = specialistUser.Id,
                    ProductGroup = "Financial",
                    ProjectStage = "Deployment",
                    Status = "In Progress",
                    StartDate = now.AddDays(-20),
                    EndDate = now.AddDays(40),
                    Progress = 65,
                    Weight = 100,
                    Credit = "Tier 1 Priority",
                    CommittedHours = 120,
                    Color = "#3b82f6",
                    CreatedAt = now.AddDays(-25),
                    CreatedById = adminUser.Id,
                    IsDelivered = false
                };

                var p2 = new Project
                {
                    Title = "HR & Payroll Infrastructure Automation",
                    CrmCode = "CRM-1025",
                    BuyerName = "Dana Energy Group",
                    ProjectManagerId = pmUser.Id,
                    ProjectAssigneeId = specialistUser.Id,
                    ProductGroup = "HR & Payroll",
                    ProjectStage = "Deployment",
                    Status = "In Progress",
                    StartDate = now.AddDays(-15),
                    EndDate = now.AddDays(30),
                    Progress = 45,
                    Weight = 100,
                    Credit = "Standard",
                    CommittedHours = 80,
                    Color = "#10b981",
                    CreatedAt = now.AddDays(-20),
                    CreatedById = adminUser.Id,
                    IsDelivered = false
                };

                var p3 = new Project
                {
                    Title = "Executive Management Dashboard",
                    CrmCode = "CRM-1026",
                    BuyerName = "MAPNA Group",
                    ProjectManagerId = adminUser.Id,
                    ProjectAssigneeId = pmUser.Id,
                    ProductGroup = "Administrative",
                    ProjectStage = "Deployment",
                    Status = "Planned",
                    StartDate = now.AddDays(5),
                    EndDate = now.AddDays(60),
                    Progress = 10,
                    Weight = 100,
                    Credit = "VIP",
                    CommittedHours = 160,
                    Color = "#8b5cf6",
                    CreatedAt = now.AddDays(-5),
                    CreatedById = adminUser.Id,
                    IsDelivered = false
                };

                context.Projects.AddRange(p1, p2, p3);
                context.SaveChanges();

                // Sub-projects
                var sub1 = new Project
                {
                    ParentProjectId = p1.Id,
                    Title = "General Ledger & Accounts Setup",
                    CrmCode = "CRM-1024-01",
                    BuyerName = p1.BuyerName,
                    ProjectManagerId = pmUser.Id,
                    ProjectAssigneeId = specialistUser.Id,
                    ProductGroup = "Financial",
                    Status = "In Progress",
                    StartDate = p1.StartDate,
                    EndDate = now.AddDays(10),
                    Progress = 80,
                    Weight = 60,
                    Color = "#3b82f6",
                    CreatedAt = now.AddDays(-20),
                    CreatedById = adminUser.Id,
                    IsDelivered = false
                };

                var sub2 = new Project
                {
                    ParentProjectId = p1.Id,
                    Title = "Treasury & Bank Reconciliations",
                    CrmCode = "CRM-1024-02",
                    BuyerName = p1.BuyerName,
                    ProjectManagerId = pmUser.Id,
                    ProjectAssigneeId = specialistUser.Id,
                    ProductGroup = "Financial",
                    Status = "In Progress",
                    StartDate = now.AddDays(-5),
                    EndDate = now.AddDays(25),
                    Progress = 40,
                    Weight = 40,
                    Color = "#ef4444",
                    CreatedAt = now.AddDays(-10),
                    CreatedById = adminUser.Id,
                    IsDelivered = false
                };

                context.Projects.AddRange(sub1, sub2);
                context.SaveChanges();

                // Checklists
                var chk1 = new ProjectChecklist { ProjectId = sub1.Id, StepName = "Requirements Analysis", IsCompleted = true, CompletedAt = now.AddDays(-15), CompletedByUserId = pmUser.Id };
                var chk2 = new ProjectChecklist { ProjectId = sub1.Id, StepName = "System Setup & Config", IsCompleted = true, CompletedAt = now.AddDays(-5), CompletedByUserId = specialistUser.Id };
                var chk3 = new ProjectChecklist { ProjectId = sub1.Id, StepName = "Data Migration", IsCompleted = false };
                context.ProjectChecklists.AddRange(chk1, chk2, chk3);
                context.SaveChanges();

                // Gantt & Board Tasks
                context.Tasks.AddRange(
                    new TaskModel
                    {
                        ProjectId = p1.Id,
                        Title = "Core Ledger Module Setup",
                        TaskType = "GANTT",
                        Status = "Done",
                        Priority = "High",
                        StartDate = now.AddDays(-15),
                        DueDate = now.AddDays(-5),
                        EstimatedHours = 24,
                        AllocatedHours = 24,
                        TotalUnits = 10,
                        CompletedUnits = 10,
                        Progress = 100,
                        AssigneeId = specialistUser.Id,
                        PlannedColor = "#3b82f6",
                        ExecutedColor = "#10b981",
                        CreatedAt = now.AddDays(-20),
                        CreatedById = adminUser.Id
                    },
                    new TaskModel
                    {
                        ProjectId = p1.Id,
                        Title = "Treasury Workflow & Approvals",
                        TaskType = "GANTT",
                        Status = "InProgress",
                        Priority = "Medium",
                        StartDate = now.AddDays(-4),
                        DueDate = now.AddDays(15),
                        EstimatedHours = 32,
                        AllocatedHours = 16,
                        TotalUnits = 19,
                        CompletedUnits = 9,
                        Progress = 47,
                        AssigneeId = specialistUser.Id,
                        PlannedColor = "#ef4444",
                        ExecutedColor = "#10b981",
                        CreatedAt = now.AddDays(-10),
                        CreatedById = adminUser.Id
                    },
                    new TaskModel
                    {
                        ProjectId = p2.Id,
                        Title = "Personnel Records Structuring",
                        TaskType = "GANTT",
                        Status = "InProgress",
                        Priority = "Medium",
                        StartDate = now.AddDays(-10),
                        DueDate = now.AddDays(10),
                        EstimatedHours = 20,
                        AllocatedHours = 12,
                        TotalUnits = 20,
                        CompletedUnits = 12,
                        Progress = 60,
                        AssigneeId = specialistUser.Id,
                        PlannedColor = "#10b981",
                        ExecutedColor = "#10b981",
                        CreatedAt = now.AddDays(-15),
                        CreatedById = adminUser.Id
                    }
                );
                context.SaveChanges();

                // Meetings
                context.Meetings.Add(new Meeting
                {
                    ProjectId = p1.Id,
                    Title = "Weekly Steering Committee & Progress Review",
                    StartTime = now.AddDays(1).Date.AddHours(10),
                    EndTime = now.AddDays(1).Date.AddHours(11).AddMinutes(30),
                    Agenda = "Review general ledger deployment progress and resolve data migration blockers.",
                    Color = "#3b82f6",
                    CreatedByUserId = adminUser.Id,
                    CreatedAt = now,
                    ParticipantsJson = "[{\"id\":1,\"name\":\"Artavix Administrator\",\"email\":\"admin@artavix.com\"},{\"id\":2,\"name\":\"Amin Mousavi\",\"email\":\"amin@artavix.com\"}]"
                });

                // Follow-ups
                context.ProjectFollowUps.Add(new ProjectFollowUp
                {
                    ProjectId = p1.Id,
                    UserId = pmUser.Id,
                    Content = "Client requested an additional chart of accounts tier for international sub-branches.",
                    FollowUpDate = now.AddDays(-2),
                    IsResolved = false,
                    CreatedAt = now.AddDays(-2)
                });

                context.SaveChanges();
            }

            // 6. Seed Public Chat Channel
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

                var allUserIds = context.Users.Select(u => u.Id).ToList();
                foreach (var uid in allUserIds)
                {
                    if (!context.ChatChannelMembers.Any(m => m.UserId == uid && m.ChannelId == generalChannel.Id))
                    {
                        context.ChatChannelMembers.Add(new ChatChannelMember { UserId = uid, ChannelId = generalChannel.Id });
                    }
                }
                context.SaveChanges();
            }
        }
    }
}