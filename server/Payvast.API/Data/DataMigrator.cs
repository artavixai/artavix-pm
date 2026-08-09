using Microsoft.EntityFrameworkCore;
using Payvast.API.Models;
using System;
using System.Linq;

namespace Payvast.API.Data
{
    public static class DataMigrator
    {
        public static void ForceMigrateFromSqlServer(ApplicationDbContext sqliteContext, string sqlServerConnStr)
        {
            try
            {
                Console.WriteLine("[DataMigrator] Connecting to SQL Server for FULL migration...");

                var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
                optionsBuilder.UseSqlServer(sqlServerConnStr);

                using (var sqlContext = new ApplicationDbContext(optionsBuilder.Options))
                {
                    if (!sqlContext.Database.CanConnect())
                    {
                        Console.WriteLine("[DataMigrator Warning] Could not connect to SQL Server. Proceeding with existing SQLite data.");
                        return;
                    }

                    // Clear existing SQLite data to ensure 100% clean copy
                    sqliteContext.Database.EnsureDeleted();
                    sqliteContext.Database.EnsureCreated();

                    Console.WriteLine("[DataMigrator] SQLite database reset. Copying all tables...");

                    // 1. Roles
                    var roles = sqlContext.Roles.AsNoTracking().ToList();
                    if (roles.Any())
                    {
                        sqliteContext.Roles.AddRange(roles);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {roles.Count} Roles.");
                    }

                    // 2. Users
                    var users = sqlContext.Users.AsNoTracking().ToList();
                    if (users.Any())
                    {
                        sqliteContext.Users.AddRange(users);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {users.Count} Users.");
                    }

                    // 3. UserRoles
                    var userRoles = sqlContext.UserRoles.AsNoTracking().ToList();
                    if (userRoles.Any())
                    {
                        sqliteContext.UserRoles.AddRange(userRoles);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {userRoles.Count} UserRoles.");
                    }

                    // 4. ProductGroups, Subsystems & TaskTemplates
                    var productGroups = sqlContext.ProductGroups.Include(pg => pg.Subsystems).AsNoTracking().ToList();
                    if (productGroups.Any())
                    {
                        sqliteContext.ProductGroups.AddRange(productGroups);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {productGroups.Count} ProductGroups.");
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
                        Console.WriteLine($"[DataMigrator] Migrated {projects.Count} Projects.");
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
                        Console.WriteLine($"[DataMigrator] Migrated {tasks.Count} Tasks.");
                    }

                    // 8. Notes
                    var notes = sqlContext.Notes.AsNoTracking().ToList();
                    if (notes.Any())
                    {
                        sqliteContext.Notes.AddRange(notes);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {notes.Count} Notes.");
                    }

                    // 9. Chat Channels, Members, Messages, Reactions
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
                        Console.WriteLine($"[DataMigrator] Migrated {messages.Count} Chat Messages.");
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
                        Console.WriteLine($"[DataMigrator] Migrated {meetings.Count} Meetings.");
                    }

                    // 11. FollowUps & Documents
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
                        Console.WriteLine($"[DataMigrator] Migrated {plans.Count} Weekly Plans.");
                    }

                    Console.WriteLine("==================================================");
                    Console.WriteLine("🎉 [DataMigrator] ALL TABLES & DATA MIGRATED 100% SUCCESSFULLY!");
                    Console.WriteLine("==================================================");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DataMigrator Exception] {ex.Message}");
            }
        }
    }
}