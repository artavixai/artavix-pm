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

            // 1. Roles
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

            // 2. 8 Personnel (4 Men, 4 Women)
            var staffList = new List<(string username, string fullName, string email, string jobTitle, int daily, int monthly, string avatar, Role role)>
            {
                // Men
                ("admin", "Alexander Wright", "alex.wright@artavix.com", "Chief Technology Officer", 9, 198, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", superAdminRole),
                ("david.chen", "David Chen", "david.chen@artavix.com", "Lead Project Manager", 9, 198, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", pmRole),
                ("marcus.vance", "Marcus Vance", "marcus.vance@artavix.com", "Senior Financial Architect", 8, 176, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", memberRole),
                ("liam.brooks", "Liam Brooks", "liam.brooks@artavix.com", "Integration & Cloud Engineer", 8, 176, "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150", memberRole),
                
                // Women
                ("elena.rostova", "Elena Rostova", "elena.rostova@artavix.com", "Senior Technical PM", 9, 198, "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", pmRole),
                ("sophia.taylor", "Sophia Taylor", "sophia.taylor@artavix.com", "ERP Systems Specialist", 8, 176, "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150", memberRole),
                ("chloe.bennett", "Chloe Bennett", "chloe.bennett@artavix.com", "QA & Compliance Lead", 8, 176, "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", memberRole),
                ("olivia.martinez", "Olivia Martinez", "olivia.martinez@artavix.com", "HR Process Engineer", 8, 176, "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150", memberRole)
            };

            foreach (var staff in staffList)
            {
                var user = context.Users.FirstOrDefault(u => u.Username == staff.username);
                if (user == null)
                {
                    user = new User
                    {
                        Username = staff.username,
                        FullName = staff.fullName,
                        Email = staff.email,
                        JobTitle = staff.jobTitle,
                        PhoneNumber = "+1 (555) 019-2834",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        MonthlyCapacityHours = staff.monthly,
                        DailyCapacityHours = staff.daily
                    };
                    context.Users.Add(user);
                    context.SaveChanges();

                    if (staff.role != null)
                    {
                        context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = staff.role.Id });
                        context.SaveChanges();
                    }
                }
            }

            var admin = context.Users.First(u => u.Username == "admin");
            var pm1 = context.Users.First(u => u.Username == "david.chen");
            var pm2 = context.Users.First(u => u.Username == "elena.rostova");
            var dev1 = context.Users.First(u => u.Username == "marcus.vance");
            var dev2 = context.Users.First(u => u.Username == "sophia.taylor");
            var dev3 = context.Users.First(u => u.Username == "liam.brooks");
            var dev4 = context.Users.First(u => u.Username == "chloe.bennett");
            var dev5 = context.Users.First(u => u.Username == "olivia.martinez");

            // 3. Product Groups & Subsystems
            if (!context.ProductGroups.Any())
            {
                var pgFinancial = new ProductGroup { Name = "Financial Systems", Color = "#ef4444" };
                var pgAdmin = new ProductGroup { Name = "Enterprise Operations", Color = "#3b82f6" };
                var pgHR = new ProductGroup { Name = "Human Resources & Payroll", Color = "#10b981" };
                var pgWorkflow = new ProductGroup { Name = "Workflow & Form Engine", Color = "#8b5cf6" };
                context.ProductGroups.AddRange(pgFinancial, pgAdmin, pgHR, pgWorkflow);
                context.SaveChanges();

                var subLedger = new Subsystem { Name = "General Ledger & Treasury", ProductGroupId = pgFinancial.Id };
                var subAsset = new Subsystem { Name = "Fixed Assets Management", ProductGroupId = pgFinancial.Id };
                var subHRCore = new Subsystem { Name = "Staff Onboarding & Payroll", ProductGroupId = pgHR.Id };
                var subDocFlow = new Subsystem { Name = "Automated Document Routing", ProductGroupId = pgWorkflow.Id };
                context.Subsystems.AddRange(subLedger, subAsset, subHRCore, subDocFlow);
                context.SaveChanges();

                context.TaskTemplates.AddRange(
                    new TaskTemplate { Title = "COA Hierarchy Structuring", DefaultDurationInDays = 3, DefaultWeight = 30, SubsystemId = subLedger.Id },
                    new TaskTemplate { Title = "Multi-Currency Banking Setup", DefaultDurationInDays = 2, DefaultWeight = 40, SubsystemId = subLedger.Id },
                    new TaskTemplate { Title = "Asset Depreciation Policies", DefaultDurationInDays = 2, DefaultWeight = 50, SubsystemId = subAsset.Id },
                    new TaskTemplate { Title = "Payroll Tax Rule Engine Setup", DefaultDurationInDays = 4, DefaultWeight = 50, SubsystemId = subHRCore.Id }
                );

                context.ProjectStepTemplates.AddRange(
                    new ProjectStepTemplate { ProductGroupId = pgFinancial.Id, StepName = "Requirements & Architecture", DisplayOrder = 1, IsActive = true },
                    new ProjectStepTemplate { ProductGroupId = pgFinancial.Id, StepName = "Core Configuration & Setup", DisplayOrder = 2, IsActive = true },
                    new ProjectStepTemplate { ProductGroupId = pgFinancial.Id, StepName = "Migration & Data Loading", DisplayOrder = 3, IsActive = true },
                    new ProjectStepTemplate { ProductGroupId = pgFinancial.Id, StepName = "UAT & Specialist Training", DisplayOrder = 4, IsActive = true },
                    new ProjectStepTemplate { ProductGroupId = pgFinancial.Id, StepName = "Final Delivery & Handover", DisplayOrder = 5, IsActive = true }
                );
                context.SaveChanges();
            }

            // 4. Form & Report Templates
            if (!context.FormTemplates.Any())
            {
                var ft1 = new FormTemplate { Name = "Core Financial Audit Matrix", Color = "#ef4444", DefaultSessionsCount = 5, IsActive = true };
                var ft2 = new FormTemplate { Name = "Corporate HR Alignment Process", Color = "#10b981", DefaultSessionsCount = 4, IsActive = true };
                context.FormTemplates.AddRange(ft1, ft2);
                context.SaveChanges();

                context.FormStepTemplates.AddRange(
                    new FormStepTemplate { FormTemplateId = ft1.Id, StepName = "Scope Analysis", StepOrder = 1, RequiredSessions = 1, DefaultHoursPerSession = 4 },
                    new FormStepTemplate { FormTemplateId = ft1.Id, StepName = "Execution & Testing", StepOrder = 2, RequiredSessions = 2, DefaultHoursPerSession = 4 },
                    new FormStepTemplate { FormTemplateId = ft1.Id, StepName = "Sign-off Meeting", StepOrder = 3, RequiredSessions = 2, DefaultHoursPerSession = 4 }
                );
                context.SaveChanges();
            }

            if (!context.ReportTemplates.Any())
            {
                var rt1 = new ReportTemplate { Name = "Quarterly Resource Efficiency Report", Color = "#f97316", DefaultSessionsCount = 3, IsActive = true };
                context.ReportTemplates.Add(rt1);
                context.SaveChanges();

                context.ReportStepTemplates.AddRange(
                    new ReportStepTemplate { ReportTemplateId = rt1.Id, StepName = "Data Aggregation", StepOrder = 1, RequiredSessions = 1, DefaultHoursPerSession = 4 },
                    new ReportStepTemplate { ReportTemplateId = rt1.Id, StepName = "Executive Review", StepOrder = 2, RequiredSessions = 2, DefaultHoursPerSession = 4 }
                );
                context.SaveChanges();
            }

            // 5. Rich Projects Portfolio
            if (!context.Projects.Any())
            {
                var now = DateTime.UtcNow;

                // Project 1: Successful / Completed (100%)
                var p1 = new Project
                {
                    Title = "Global Treasury & Banking Integration",
                    CrmCode = "CRM-8810",
                    BuyerName = "Chevron Energy Corp",
                    ProjectManagerId = pm1.Id,
                    ProjectAssigneeId = dev1.Id,
                    ProductGroup = "Financial Systems",
                    ProjectStage = "Handover",
                    Status = "Completed",
                    StartDate = now.AddDays(-60),
                    EndDate = now.AddDays(-5),
                    Progress = 100,
                    Weight = 100,
                    Credit = "Tier 1 Enterprise",
                    CommittedHours = 180,
                    Color = "#10b981",
                    CreatedAt = now.AddDays(-70),
                    CreatedById = admin.Id,
                    IsDelivered = true
                };

                // Project 2: In-Progress / On-Track (Healthy)
                var p2 = new Project
                {
                    Title = "Enterprise Financial Master Rollout",
                    CrmCode = "CRM-9020",
                    BuyerName = "Petro Pars International Holding",
                    ProjectManagerId = pm1.Id,
                    ProjectAssigneeId = dev2.Id,
                    ProductGroup = "Financial Systems",
                    ProjectStage = "Deployment",
                    Status = "In Progress",
                    StartDate = now.AddDays(-20),
                    EndDate = now.AddDays(45),
                    Progress = 65,
                    Weight = 100,
                    Credit = "Premium Support",
                    CommittedHours = 220,
                    Color = "#3b82f6",
                    CreatedAt = now.AddDays(-25),
                    CreatedById = admin.Id,
                    IsDelivered = false
                };

                // Project 3: Highly Complex with 3 Sub-Projects
                var p3 = new Project
                {
                    Title = "HR & Payroll Infrastructure Automation",
                    CrmCode = "CRM-9130",
                    BuyerName = "Dana Energy Consortium",
                    ProjectManagerId = pm2.Id,
                    ProjectAssigneeId = dev5.Id,
                    ProductGroup = "Human Resources & Payroll",
                    ProjectStage = "Deployment",
                    Status = "In Progress",
                    StartDate = now.AddDays(-15),
                    EndDate = now.AddDays(35),
                    Progress = 48,
                    Weight = 100,
                    Credit = "Strategic Client",
                    CommittedHours = 190,
                    Color = "#8b5cf6",
                    CreatedAt = now.AddDays(-20),
                    CreatedById = admin.Id,
                    IsDelivered = false
                };

                // Project 4: Critical / Delayed (Negative Deviation)
                var p4 = new Project
                {
                    Title = "Automated Document Routing & Workflow Hub",
                    CrmCode = "CRM-7420",
                    BuyerName = "Titan Logistics Global",
                    ProjectManagerId = pm2.Id,
                    ProjectAssigneeId = dev3.Id,
                    ProductGroup = "Workflow & Form Engine",
                    ProjectStage = "Testing & QA",
                    Status = "Critical",
                    CustomStatus = "Blocked by External API",
                    BlockedBy = "Client Security Team",
                    BlockedReason = "Firewall and VPN Gateway approval pending",
                    StartDate = now.AddDays(-40),
                    EndDate = now.AddDays(-2),
                    Progress = 35,
                    Weight = 100,
                    Credit = "Standard",
                    CommittedHours = 140,
                    Color = "#ef4444",
                    CreatedAt = now.AddDays(-45),
                    CreatedById = admin.Id,
                    IsDelivered = false
                };

                // Project 5: Planned (Future)
                var p5 = new Project
                {
                    Title = "Executive Management AI Dashboard",
                    CrmCode = "CRM-9500",
                    BuyerName = "MAPNA Industrial Group",
                    ProjectManagerId = admin.Id,
                    ProjectAssigneeId = dev4.Id,
                    ProductGroup = "Enterprise Operations",
                    ProjectStage = "Architecture",
                    Status = "Planned",
                    StartDate = now.AddDays(10),
                    EndDate = now.AddDays(70),
                    Progress = 0,
                    Weight = 100,
                    Credit = "VIP Account",
                    CommittedHours = 160,
                    Color = "#06b6d4",
                    CreatedAt = now.AddDays(-2),
                    CreatedById = admin.Id,
                    IsDelivered = false
                };

                context.Projects.AddRange(p1, p2, p3, p4, p5);
                context.SaveChanges();

                // Sub-Projects for Project 2 & Project 3
                var sub2_1 = new Project
                {
                    ParentProjectId = p2.Id,
                    Title = "General Ledger & Fiscal Calendar",
                    CrmCode = "CRM-9020-01",
                    BuyerName = p2.BuyerName,
                    ProjectManagerId = pm1.Id,
                    ProjectAssigneeId = dev1.Id,
                    ProductGroup = "Financial Systems",
                    Status = "In Progress",
                    StartDate = p2.StartDate,
                    EndDate = now.AddDays(15),
                    Progress = 80,
                    Weight = 60,
                    Color = "#3b82f6",
                    CreatedAt = now.AddDays(-20),
                    CreatedById = admin.Id,
                    IsDelivered = false
                };

                var sub2_2 = new Project
                {
                    ParentProjectId = p2.Id,
                    Title = "Treasury & Bank Payment Gateways",
                    CrmCode = "CRM-9020-02",
                    BuyerName = p2.BuyerName,
                    ProjectManagerId = pm1.Id,
                    ProjectAssigneeId = dev2.Id,
                    ProductGroup = "Financial Systems",
                    Status = "In Progress",
                    StartDate = now.AddDays(-5),
                    EndDate = now.AddDays(30),
                    Progress = 42,
                    Weight = 40,
                    Color = "#f59e0b",
                    CreatedAt = now.AddDays(-10),
                    CreatedById = admin.Id,
                    IsDelivered = false
                };

                var sub3_1 = new Project
                {
                    ParentProjectId = p3.Id,
                    Title = "Staff Master Records & Compensation",
                    CrmCode = "CRM-9130-01",
                    BuyerName = p3.BuyerName,
                    ProjectManagerId = pm2.Id,
                    ProjectAssigneeId = dev5.Id,
                    ProductGroup = "Human Resources & Payroll",
                    Status = "In Progress",
                    StartDate = p3.StartDate,
                    EndDate = now.AddDays(20),
                    Progress = 60,
                    Weight = 50,
                    Color = "#10b981",
                    CreatedAt = now.AddDays(-15),
                    CreatedById = admin.Id,
                    IsDelivered = false
                };

                var sub3_2 = new Project
                {
                    ParentProjectId = p3.Id,
                    Title = "Attendance Clocking & Overtime Engine",
                    CrmCode = "CRM-9130-02",
                    BuyerName = p3.BuyerName,
                    ProjectManagerId = pm2.Id,
                    ProjectAssigneeId = dev4.Id,
                    ProductGroup = "Human Resources & Payroll",
                    Status = "In Progress",
                    StartDate = now.AddDays(-5),
                    EndDate = now.AddDays(25),
                    Progress = 35,
                    Weight = 50,
                    Color = "#8b5cf6",
                    CreatedAt = now.AddDays(-10),
                    CreatedById = admin.Id,
                    IsDelivered = false
                };

                context.Projects.AddRange(sub2_1, sub2_2, sub3_1, sub3_2);
                context.SaveChanges();

                // Checklists
                context.ProjectChecklists.AddRange(
                    new ProjectChecklist { ProjectId = sub2_1.Id, StepName = "Requirements Analysis", IsCompleted = true, CompletedAt = now.AddDays(-14), CompletedByUserId = pm1.Id },
                    new ProjectChecklist { ProjectId = sub2_1.Id, StepName = "System Setup & Config", IsCompleted = true, CompletedAt = now.AddDays(-5), CompletedByUserId = dev1.Id },
                    new ProjectChecklist { ProjectId = sub2_1.Id, StepName = "Migration & Data Loading", IsCompleted = false },
                    new ProjectChecklist { ProjectId = sub3_1.Id, StepName = "Staff File Structure", IsCompleted = true, CompletedAt = now.AddDays(-8), CompletedByUserId = dev5.Id },
                    new ProjectChecklist { ProjectId = sub3_1.Id, StepName = "Tax Rules Validation", IsCompleted = false }
                );
                context.SaveChanges();

                // 6. Gantt Tasks Distributed Across Specialists (For Multi-Color Donut Charts)
                context.Tasks.AddRange(
                    new TaskModel
                    {
                        ProjectId = p1.Id,
                        Title = "Core Ledger Module Integration",
                        TaskType = "GANTT",
                        Status = "Done",
                        Priority = "High",
                        StartDate = now.AddDays(-50),
                        DueDate = now.AddDays(-30),
                        EstimatedHours = 40,
                        AllocatedHours = 40,
                        TotalUnits = 20,
                        CompletedUnits = 20,
                        Progress = 100,
                        AssigneeId = dev1.Id,
                        PlannedColor = "#3b82f6",
                        ExecutedColor = "#10b981",
                        CreatedAt = now.AddDays(-55),
                        CreatedById = admin.Id
                    },
                    new TaskModel
                    {
                        ProjectId = p2.Id,
                        Title = "COA Hierarchy & Ledger Setup",
                        TaskType = "GANTT",
                        Status = "InProgress",
                        Priority = "High",
                        StartDate = now.AddDays(-15),
                        DueDate = now.AddDays(10),
                        EstimatedHours = 48,
                        AllocatedHours = 36,
                        TotalUnits = 25,
                        CompletedUnits = 18,
                        Progress = 72,
                        AssigneeId = dev2.Id,
                        PlannedColor = "#3b82f6",
                        ExecutedColor = "#10b981",
                        CreatedAt = now.AddDays(-20),
                        CreatedById = admin.Id
                    },
                    new TaskModel
                    {
                        ProjectId = p2.Id,
                        Title = "Bank Reconciliation Workflow",
                        TaskType = "GANTT",
                        Status = "InProgress",
                        Priority = "Medium",
                        StartDate = now.AddDays(-4),
                        DueDate = now.AddDays(20),
                        EstimatedHours = 36,
                        AllocatedHours = 18,
                        TotalUnits = 24,
                        CompletedUnits = 10,
                        Progress = 42,
                        AssigneeId = dev1.Id,
                        PlannedColor = "#f59e0b",
                        ExecutedColor = "#10b981",
                        CreatedAt = now.AddDays(-10),
                        CreatedById = admin.Id
                    },
                    new TaskModel
                    {
                        ProjectId = p3.Id,
                        Title = "Employee Master File Structuring",
                        TaskType = "GANTT",
                        Status = "InProgress",
                        Priority = "Medium",
                        StartDate = now.AddDays(-10),
                        DueDate = now.AddDays(15),
                        EstimatedHours = 32,
                        AllocatedHours = 20,
                        TotalUnits = 25,
                        CompletedUnits = 15,
                        Progress = 60,
                        AssigneeId = dev5.Id,
                        PlannedColor = "#10b981",
                        ExecutedColor = "#10b981",
                        CreatedAt = now.AddDays(-15),
                        CreatedById = admin.Id
                    },
                    new TaskModel
                    {
                        ProjectId = p3.Id,
                        Title = "Automated Biometric Clocking Engine",
                        TaskType = "GANTT",
                        Status = "InProgress",
                        Priority = "High",
                        StartDate = now.AddDays(-5),
                        DueDate = now.AddDays(22),
                        EstimatedHours = 44,
                        AllocatedHours = 16,
                        TotalUnits = 27,
                        CompletedUnits = 10,
                        Progress = 37,
                        AssigneeId = dev4.Id,
                        PlannedColor = "#8b5cf6",
                        ExecutedColor = "#10b981",
                        CreatedAt = now.AddDays(-10),
                        CreatedById = admin.Id
                    },
                    new TaskModel
                    {
                        ProjectId = p4.Id,
                        Title = "REST API Gateway Implementation",
                        TaskType = "GANTT",
                        Status = "InProgress",
                        Priority = "High",
                        StartDate = now.AddDays(-30),
                        DueDate = now.AddDays(-5),
                        EstimatedHours = 56,
                        AllocatedHours = 24,
                        TotalUnits = 25,
                        CompletedUnits = 9,
                        Progress = 36,
                        AssigneeId = dev3.Id,
                        PlannedColor = "#ef4444",
                        ExecutedColor = "#10b981",
                        CreatedAt = now.AddDays(-35),
                        CreatedById = admin.Id
                    }
                );
                context.SaveChanges();

                // 7. Weekly Planning Records for Multiple Specialists
                context.WeeklyPlans.AddRange(
                    new WeeklyPlan { UserId = dev1.Id, Title = "General Ledger Account Auditing", Description = "Reviewing chart of accounts with CFO", PlanDate = now.Date.AddDays(0), StartHour = 9, EndHour = 12, Color = "#3b82f6", SourceType = "Manual", CreatedAt = now },
                    new WeeklyPlan { UserId = dev1.Id, Title = "Treasury Payment Workflow QA", Description = "Testing bank batch payments", PlanDate = now.Date.AddDays(1), StartHour = 13, EndHour = 17, Color = "#f59e0b", SourceType = "Manual", CreatedAt = now },
                    new WeeklyPlan { UserId = dev2.Id, Title = "Financial Policy Documentation", Description = "Writing fiscal configuration docs", PlanDate = now.Date.AddDays(0), StartHour = 8.5, EndHour = 12.5, Color = "#3b82f6", SourceType = "Manual", CreatedAt = now },
                    new WeeklyPlan { UserId = dev2.Id, Title = "Client Sandbox Data Verification", Description = "Checking trial balance delta", PlanDate = now.Date.AddDays(2), StartHour = 10, EndHour = 14, Color = "#10b981", SourceType = "Manual", CreatedAt = now },
                    new WeeklyPlan { UserId = dev5.Id, Title = "HR Schema Alignment", Description = "Validating employee payroll tiers", PlanDate = now.Date.AddDays(0), StartHour = 9, EndHour = 13, Color = "#10b981", SourceType = "Manual", CreatedAt = now },
                    new WeeklyPlan { UserId = dev3.Id, Title = "API Gateway Security Review", Description = "Resolving firewall and TLS restrictions", PlanDate = now.Date.AddDays(1), StartHour = 9, EndHour = 15, Color = "#ef4444", SourceType = "Manual", CreatedAt = now }
                );
                context.SaveChanges();

                // 8. Meetings
                context.Meetings.AddRange(
                    new Meeting
                    {
                        ProjectId = p2.Id,
                        Title = "Executive Steering Committee & Milestone Review",
                        StartTime = now.AddDays(1).Date.AddHours(10),
                        EndTime = now.AddDays(1).Date.AddHours(11).AddMinutes(30),
                        Agenda = "Evaluate General Ledger rollout progress, confirm stage 2 migration sign-off, and resolve integration blockers.",
                        Color = "#3b82f6",
                        CreatedByUserId = admin.Id,
                        CreatedAt = now,
                        ParticipantsJson = "[{\"id\":1,\"name\":\"Alexander Wright\",\"email\":\"alex.wright@artavix.com\"},{\"id\":2,\"name\":\"David Chen\",\"email\":\"david.chen@artavix.com\"},{\"id\":6,\"name\":\"Sophia Taylor\",\"email\":\"sophia.taylor@artavix.com\"}]"
                    },
                    new Meeting
                    {
                        ProjectId = p3.Id,
                        Title = "HR Payroll Tax Matrix Alignment Session",
                        StartTime = now.AddDays(2).Date.AddHours(14),
                        EndTime = now.AddDays(2).Date.AddHours(15).AddMinutes(30),
                        Agenda = "Harmonize corporate tax computation rules and overtime multipliers with statutory compliance.",
                        Color = "#10b981",
                        CreatedByUserId = pm2.Id,
                        CreatedAt = now,
                        ParticipantsJson = "[{\"id\":5,\"name\":\"Elena Rostova\",\"email\":\"elena.rostova@artavix.com\"},{\"id\":8,\"name\":\"Olivia Martinez\",\"email\":\"olivia.martinez@artavix.com\"}]"
                    },
                    new Meeting
                    {
                        ProjectId = null,
                        Title = "All-Hands Architecture & Sprint Retrospective",
                        StartTime = now.AddDays(4).Date.AddHours(16),
                        EndTime = now.AddDays(4).Date.AddHours(17).AddMinutes(30),
                        Agenda = "Company-wide bi-weekly engineering retrospective and Q3 strategic milestones planning.",
                        Color = "#8b5cf6",
                        CreatedByUserId = admin.Id,
                        CreatedAt = now,
                        ParticipantsJson = "[{\"id\":1,\"name\":\"Alexander Wright\"},{\"id\":2,\"name\":\"David Chen\"},{\"id\":3,\"name\":\"Marcus Vance\"},{\"id\":4,\"name\":\"Liam Brooks\"}]"
                    }
                );
                context.SaveChanges();

                // 9. Notes
                context.Notes.AddRange(
                    new Note { UserId = admin.Id, Title = "Quarterly Infrastructure Scaling Strategy", Category = "Work", Content = "Finalize migration of high-throughput SignalR hubs to dedicated Redis backplane nodes before enterprise peak season.", CreatedAt = now.AddDays(-3), UpdatedAt = now.AddDays(-1) },
                    new Note { UserId = admin.Id, Title = "AI Model Fine-tuning & LPU Optimization", Category = "Idea", Content = "Explore Llama 3.3 70B prompt compression to reduce round-trip latency below 400ms for live WBS evaluation.", CreatedAt = now.AddDays(-2), UpdatedAt = now },
                    new Note { UserId = admin.Id, Title = "Board Meeting Action Items", Category = "Meeting", Content = "1. Approve Q3 capacity expansion for 4 new senior specialists.<br/>2. Finalize Petro Pars enterprise SLA agreement.", CreatedAt = now.AddDays(-1), UpdatedAt = now },
                    new Note { UserId = admin.Id, Title = "Personal Growth & Reading", Category = "Personal", Content = "Review Clean Architecture Domain-Driven Design patterns for real-time collaboration engines.", CreatedAt = now.AddDays(-5), UpdatedAt = now }
                );
                context.SaveChanges();

                // 10. Direct Discussions & Messages
                var channel1 = new ChatChannel { Name = "DirectChat", ChannelType = "Direct", IsPrivate = true, CreatedAt = now.AddDays(-5) };
                var channel2 = new ChatChannel { Name = "DirectChat", ChannelType = "Direct", IsPrivate = true, CreatedAt = now.AddDays(-4) };
                context.ChatChannels.AddRange(channel1, channel2);
                context.SaveChanges();

                context.ChatChannelMembers.AddRange(
                    new ChatChannelMember { ChannelId = channel1.Id, UserId = admin.Id },
                    new ChatChannelMember { ChannelId = channel1.Id, UserId = pm1.Id },
                    new ChatChannelMember { ChannelId = channel2.Id, UserId = admin.Id },
                    new ChatChannelMember { ChannelId = channel2.Id, UserId = dev2.Id }
                );
                context.SaveChanges();

                context.ChatMessages.AddRange(
                    new ChatMessage { ChannelId = channel1.Id, SenderId = pm1.Id, Content = "Hello Alex, General Ledger WBS milestones have been synchronized with the Gantt chart.", SentAt = now.AddDays(-1).AddHours(2) },
                    new ChatMessage { ChannelId = channel1.Id, SenderId = admin.Id, Content = "Excellent work David. Let's review the risk matrix during tomorrow's steering meeting.", SentAt = now.AddDays(-1).AddHours(3) },
                    new ChatMessage { ChannelId = channel2.Id, SenderId = dev2.Id, Content = "Hi Alex, I've finalized the trial balance verification for the Petro Pars project.", SentAt = now.AddHours(-4) },
                    new ChatMessage { ChannelId = channel2.Id, SenderId = admin.Id, Content = "Great job Sophia! Keep up the momentum.", SentAt = now.AddHours(-2) }
                );
                context.SaveChanges();

                // 11. Follow-ups
                context.ProjectFollowUps.AddRange(
                    new ProjectFollowUp { ProjectId = p2.Id, UserId = pm1.Id, Content = "Client requested an additional chart of accounts tier for international holding entities.", FollowUpDate = now.AddDays(-2), IsResolved = false, CreatedAt = now.AddDays(-2) },
                    new ProjectFollowUp { ProjectId = p4.Id, UserId = pm2.Id, Content = "Sent urgent escalation request to Titan Logistics IT security lead regarding gateway credentials.", FollowUpDate = now.AddDays(-1), IsResolved = false, CreatedAt = now.AddDays(-1) }
                );
                context.SaveChanges();
            }

            // 6. Seed Public General Channel
            if (!context.ChatChannels.Any(c => c.Name == "General" && c.ChannelType == "Public"))
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