using Microsoft.EntityFrameworkCore;
using Payvast.API.Models;
using System;
using System.Linq;

namespace Payvast.API.Data
{
    public static class DataMigrator
    {
        public static void ForceMigrateFromSqlServerIfEmpty(ApplicationDbContext sqliteContext, string sqlServerConnStr)
        {
            try
            {
                // Ensure SQLite database schema exists without deleting existing user data
                bool created = sqliteContext.Database.EnsureCreated();

                // If SQLite already contains projects/notes, DO NOT overwrite or delete user data
                if (sqliteContext.Projects.Any())
                {
                    Console.WriteLine("[DataMigrator] SQLite database contains user data. Preserving all records.");
                    return;
                }

                Console.WriteLine("[DataMigrator] SQLite database is empty. Attempting one-time migration from SQL Server...");

                var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
                optionsBuilder.UseSqlServer(sqlServerConnStr);

                using (var sqlContext = new ApplicationDbContext(optionsBuilder.Options))
                {
                    if (!sqlContext.Database.CanConnect())
                    {
                        Console.WriteLine("[DataMigrator Warning] Local SQL Server not reachable. Proceeding with SQLite schema.");
                        return;
                    }

                    // Temporarily disable foreign keys for initial SQLite population
                    sqliteContext.Database.ExecuteSqlRaw("PRAGMA foreign_keys = OFF;");

                    // 1. Roles
                    var roles = sqlContext.Roles.AsNoTracking().ToList();
                    if (roles.Any() && !sqliteContext.Roles.Any())
                    {
                        sqliteContext.Roles.AddRange(roles);
                        sqliteContext.SaveChanges();
                    }

                    // 2. Users
                    var users = sqlContext.Users.AsNoTracking().ToList();
                    if (users.Any() && !sqliteContext.Users.Any())
                    {
                        sqliteContext.Users.AddRange(users);
                        sqliteContext.SaveChanges();
                    }

                    // 3. UserRoles
                    var userRoles = sqlContext.UserRoles.AsNoTracking().ToList();
                    if (userRoles.Any() && !sqliteContext.UserRoles.Any())
                    {
                        sqliteContext.UserRoles.AddRange(userRoles);
                        sqliteContext.SaveChanges();
                    }

                    // 4. ProductGroups, Subsystems, Templates
                    var productGroups = sqlContext.ProductGroups.Include(pg => pg.Subsystems).AsNoTracking().ToList();
                    if (productGroups.Any() && !sqliteContext.ProductGroups.Any())
                    {
                        sqliteContext.ProductGroups.AddRange(productGroups);
                        sqliteContext.SaveChanges();
                    }

                    var stepTemplates = sqlContext.ProjectStepTemplates.AsNoTracking().ToList();
                    if (stepTemplates.Any() && !sqliteContext.ProjectStepTemplates.Any())
                    {
                        sqliteContext.ProjectStepTemplates.AddRange(stepTemplates);
                        sqliteContext.SaveChanges();
                    }

                    var taskTemplates = sqlContext.TaskTemplates.AsNoTracking().ToList();
                    if (taskTemplates.Any() && !sqliteContext.TaskTemplates.Any())
                    {
                        sqliteContext.TaskTemplates.AddRange(taskTemplates);
                        sqliteContext.SaveChanges();
                    }

                    // 5. Form & Report Templates
                    var formTemplates = sqlContext.FormTemplates.Include(f => f.Steps).AsNoTracking().ToList();
                    if (formTemplates.Any() && !sqliteContext.FormTemplates.Any())
                    {
                        sqliteContext.FormTemplates.AddRange(formTemplates);
                        sqliteContext.SaveChanges();
                    }

                    var reportTemplates = sqlContext.ReportTemplates.Include(r => r.Steps).AsNoTracking().ToList();
                    if (reportTemplates.Any() && !sqliteContext.ReportTemplates.Any())
                    {
                        sqliteContext.ReportTemplates.AddRange(reportTemplates);
                        sqliteContext.SaveChanges();
                    }

                    // 6. Projects & Checklists
                    var projects = sqlContext.Projects.AsNoTracking().ToList();
                    if (projects.Any() && !sqliteContext.Projects.Any())
                    {
                        sqliteContext.Projects.AddRange(projects);
                        sqliteContext.SaveChanges();
                    }

                    var checklists = sqlContext.ProjectChecklists.AsNoTracking().ToList();
                    if (checklists.Any() && !sqliteContext.ProjectChecklists.Any())
                    {
                        sqliteContext.ProjectChecklists.AddRange(checklists);
                        sqliteContext.SaveChanges();
                    }

                    // 7. Tasks
                    var tasks = sqlContext.Tasks.AsNoTracking().ToList();
                    if (tasks.Any() && !sqliteContext.Tasks.Any())
                    {
                        sqliteContext.Tasks.AddRange(tasks);
                        sqliteContext.SaveChanges();
                    }

                    // 8. Notes
                    var notes = sqlContext.Notes.AsNoTracking().ToList();
                    if (notes.Any() && !sqliteContext.Notes.Any())
                    {
                        sqliteContext.Notes.AddRange(notes);
                        sqliteContext.SaveChanges();
                    }

                    // 9. Chat Channels, Members, Messages, Reactions
                    var channels = sqlContext.ChatChannels.AsNoTracking().ToList();
                    if (channels.Any() && !sqliteContext.ChatChannels.Any())
                    {
                        sqliteContext.ChatChannels.AddRange(channels);
                        sqliteContext.SaveChanges();
                    }

                    var chatMembers = sqlContext.ChatChannelMembers.AsNoTracking().ToList();
                    if (chatMembers.Any() && !sqliteContext.ChatChannelMembers.Any())
                    {
                        sqliteContext.ChatChannelMembers.AddRange(chatMembers);
                        sqliteContext.SaveChanges();
                    }

                    var messages = sqlContext.ChatMessages.AsNoTracking().ToList();
                    if (messages.Any() && !sqliteContext.ChatMessages.Any())
                    {
                        sqliteContext.ChatMessages.AddRange(messages);
                        sqliteContext.SaveChanges();
                    }

                    var reactions = sqlContext.MessageReactions.AsNoTracking().ToList();
                    if (reactions.Any() && !sqliteContext.MessageReactions.Any())
                    {
                        sqliteContext.MessageReactions.AddRange(reactions);
                        sqliteContext.SaveChanges();
                    }

                    // 10. Meetings
                    var meetings = sqlContext.Meetings.AsNoTracking().ToList();
                    if (meetings.Any() && !sqliteContext.Meetings.Any())
                    {
                        sqliteContext.Meetings.AddRange(meetings);
                        sqliteContext.SaveChanges();
                    }

                    // 11. FollowUps & Documents
                    var followUps = sqlContext.ProjectFollowUps.AsNoTracking().ToList();
                    if (followUps.Any() && !sqliteContext.ProjectFollowUps.Any())
                    {
                        sqliteContext.ProjectFollowUps.AddRange(followUps);
                        sqliteContext.SaveChanges();
                    }

                    var documents = sqlContext.ProjectDocuments.AsNoTracking().ToList();
                    if (documents.Any() && !sqliteContext.ProjectDocuments.Any())
                    {
                        sqliteContext.ProjectDocuments.AddRange(documents);
                        sqliteContext.SaveChanges();
                    }

                    // 12. Weekly Plans
                    var plans = sqlContext.WeeklyPlans.AsNoTracking().ToList();
                    if (plans.Any() && !sqliteContext.WeeklyPlans.Any())
                    {
                        sqliteContext.WeeklyPlans.AddRange(plans);
                        sqliteContext.SaveChanges();
                    }

                    sqliteContext.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");

                    AlignAllDatesToCurrentMonth(sqliteContext);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DataMigrator Exception] {ex.Message}");
                sqliteContext.Database.EnsureCreated();
            }
        }

        public static void AlignAllDatesToCurrentMonth(ApplicationDbContext sqliteContext)
        {
            try
            {
                var tasks = sqliteContext.Tasks.ToList();
                var projects = sqliteContext.Projects.ToList();
                if (!tasks.Any()) return;

                var earliestDate = tasks.Min(t => t.StartDate);
                var now = DateTime.UtcNow;
                var targetStartDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

                TimeSpan shiftOffset = targetStartDate - earliestDate.Date;
                if (shiftOffset.TotalDays <= 0) return;

                Console.WriteLine($"[DataMigrator] Aligning all dates by {shiftOffset.TotalDays} days...");

                foreach (var t in tasks)
                {
                    t.StartDate = t.StartDate.Add(shiftOffset);
                    if (t.DueDate.HasValue) t.DueDate = t.DueDate.Value.Add(shiftOffset);
                }

                foreach (var p in projects)
                {
                    if (p.StartDate.HasValue) p.StartDate = p.StartDate.Value.Add(shiftOffset);
                    if (p.EndDate.HasValue) p.EndDate = p.EndDate.Value.Add(shiftOffset);
                }

                var meetings = sqliteContext.Meetings.ToList();
                foreach (var m in meetings)
                {
                    m.StartTime = m.StartTime.Add(shiftOffset);
                    m.EndTime = m.EndTime.Add(shiftOffset);
                }

                var plans = sqliteContext.WeeklyPlans.ToList();
                foreach (var wp in plans)
                {
                    wp.PlanDate = wp.PlanDate.Add(shiftOffset);
                }

                var followUps = sqliteContext.ProjectFollowUps.ToList();
                foreach (var fu in followUps)
                {
                    fu.FollowUpDate = fu.FollowUpDate.Add(shiftOffset);
                    if (fu.ReminderDate.HasValue) fu.ReminderDate = fu.ReminderDate.Value.Add(shiftOffset);
                }

                var notes = sqliteContext.Notes.ToList();
                foreach (var n in notes)
                {
                    if (n.ReminderDate.HasValue) n.ReminderDate = n.ReminderDate.Value.Add(shiftOffset);
                }

                sqliteContext.SaveChanges();
                Console.WriteLine("==================================================");
                Console.WriteLine("✅ [DataMigrator] DATES ALIGNED SUCCESSFULLY!");
                Console.WriteLine("==================================================");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DataMigrator Error aligning dates]: {ex.Message}");
            }
        }
    }
}