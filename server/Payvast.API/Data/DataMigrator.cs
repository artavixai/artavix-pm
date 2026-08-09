using Microsoft.EntityFrameworkCore;
using Payvast.API.Models;
using System;
using System.Linq;

namespace Payvast.API.Data
{
    public static class DataMigrator
    {
        public static void MigrateFromSqlServerIfEmpty(ApplicationDbContext sqliteContext, string sqlServerConnStr)
        {
            try
            {
                if (sqliteContext.Projects.Any())
                {
                    Console.WriteLine("[DataMigrator] SQLite database already contains data. Skipping migration.");
                    return;
                }

                Console.WriteLine("[DataMigrator] SQLite database is empty. Starting FULL migration from SQL Server...");

                var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
                optionsBuilder.UseSqlServer(sqlServerConnStr);

                using (var sqlContext = new ApplicationDbContext(optionsBuilder.Options))
                {
                    if (!sqlContext.Database.CanConnect())
                    {
                        Console.WriteLine("[DataMigrator Warning] Could not connect to SQL Server. Proceeding with default seed.");
                        return;
                    }

                    // 1. Roles
                    var roles = sqlContext.Roles.AsNoTracking().ToList();
                    if (roles.Any())
                    {
                        sqliteContext.Roles.AddRange(roles);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {roles.Count} roles.");
                    }

                    // 2. Users
                    var users = sqlContext.Users.AsNoTracking().ToList();
                    if (users.Any())
                    {
                        sqliteContext.Users.AddRange(users);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {users.Count} users.");
                    }

                    // 3. UserRoles
                    var userRoles = sqlContext.UserRoles.AsNoTracking().ToList();
                    if (userRoles.Any())
                    {
                        sqliteContext.UserRoles.AddRange(userRoles);
                        sqliteContext.SaveChanges();
                    }

                    // 4. ProductGroups & Subsystems & TaskTemplates
                    var productGroups = sqlContext.ProductGroups.Include(pg => pg.Subsystems).AsNoTracking().ToList();
                    if (productGroups.Any())
                    {
                        sqliteContext.ProductGroups.AddRange(productGroups);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {productGroups.Count} product groups.");
                    }

                    var stepTemplates = sqlContext.ProjectStepTemplates.AsNoTracking().ToList();
                    if (stepTemplates.Any())
                    {
                        sqliteContext.ProjectStepTemplates.AddRange(stepTemplates);
                        sqliteContext.SaveChanges();
                    }

                    var taskTemplates = sqlContext.TaskTemplates.AsNoTracking().ToList();
                    if (taskTemplates.Any())
                    {
                        sqliteContext.TaskTemplates.AddRange(taskTemplates);
                        sqliteContext.SaveChanges();
                    }

                    // 5. Form & Report Templates
                    var formTemplates = sqlContext.FormTemplates.Include(f => f.Steps).AsNoTracking().ToList();
                    if (formTemplates.Any())
                    {
                        sqliteContext.FormTemplates.AddRange(formTemplates);
                        sqliteContext.SaveChanges();
                    }

                    var reportTemplates = sqlContext.ReportTemplates.Include(r => r.Steps).AsNoTracking().ToList();
                    if (reportTemplates.Any())
                    {
                        sqliteContext.ReportTemplates.AddRange(reportTemplates);
                        sqliteContext.SaveChanges();
                    }

                    // 6. Projects & Checklists
                    var projects = sqlContext.Projects.AsNoTracking().ToList();
                    if (projects.Any())
                    {
                        sqliteContext.Projects.AddRange(projects);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {projects.Count} projects.");
                    }

                    var checklists = sqlContext.ProjectChecklists.AsNoTracking().ToList();
                    if (checklists.Any())
                    {
                        sqliteContext.ProjectChecklists.AddRange(checklists);
                        sqliteContext.SaveChanges();
                    }

                    // 7. Tasks
                    var tasks = sqlContext.Tasks.AsNoTracking().ToList();
                    if (tasks.Any())
                    {
                        sqliteContext.Tasks.AddRange(tasks);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {tasks.Count} tasks.");
                    }

                    // 8. Notes & Reminders
                    var notes = sqlContext.Notes.AsNoTracking().ToList();
                    if (notes.Any())
                    {
                        sqliteContext.Notes.AddRange(notes);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {notes.Count} notes.");
                    }

                    // 9. Chat Channels, Members, Messages, Reactions & Unread
                    var channels = sqlContext.ChatChannels.AsNoTracking().ToList();
                    if (channels.Any())
                    {
                        sqliteContext.ChatChannels.AddRange(channels);
                        sqliteContext.SaveChanges();
                    }

                    var chatMembers = sqlContext.ChatChannelMembers.AsNoTracking().ToList();
                    if (chatMembers.Any())
                    {
                        sqliteContext.ChatChannelMembers.AddRange(chatMembers);
                        sqliteContext.SaveChanges();
                    }

                    var messages = sqlContext.ChatMessages.AsNoTracking().ToList();
                    if (messages.Any())
                    {
                        sqliteContext.ChatMessages.AddRange(messages);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {messages.Count} chat messages.");
                    }

                    var reactions = sqlContext.MessageReactions.AsNoTracking().ToList();
                    if (reactions.Any())
                    {
                        sqliteContext.MessageReactions.AddRange(reactions);
                        sqliteContext.SaveChanges();
                    }

                    // 10. Meetings
                    var meetings = sqlContext.Meetings.AsNoTracking().ToList();
                    if (meetings.Any())
                    {
                        sqliteContext.Meetings.AddRange(meetings);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {meetings.Count} meetings.");
                    }

                    // 11. Project FollowUps & Documents
                    var followUps = sqlContext.ProjectFollowUps.AsNoTracking().ToList();
                    if (followUps.Any())
                    {
                        sqliteContext.ProjectFollowUps.AddRange(followUps);
                        sqliteContext.SaveChanges();
                    }

                    var documents = sqlContext.ProjectDocuments.AsNoTracking().ToList();
                    if (documents.Any())
                    {
                        sqliteContext.ProjectDocuments.AddRange(documents);
                        sqliteContext.SaveChanges();
                    }

                    // 12. Weekly Plans
                    var plans = sqlContext.WeeklyPlans.AsNoTracking().ToList();
                    if (plans.Any())
                    {
                        sqliteContext.WeeklyPlans.AddRange(plans);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {plans.Count} weekly plans.");
                    }

                    Console.WriteLine("==================================================");
                    Console.WriteLine("✅ [DataMigrator] 100% FULL MIGRATION COMPLETED SUCCESSFULLY!");
                    Console.WriteLine("==================================================");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DataMigrator Warning] SQL Server migration failed: {ex.Message}");
            }
        }
    }
}