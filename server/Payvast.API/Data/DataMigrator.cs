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

                Console.WriteLine("[DataMigrator] SQLite database is empty. Attempting data migration from SQL Server...");

                var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
                optionsBuilder.UseSqlServer(sqlServerConnStr);

                using (var sqlContext = new ApplicationDbContext(optionsBuilder.Options))
                {
                    if (!sqlContext.Database.CanConnect())
                    {
                        Console.WriteLine("[DataMigrator] Could not connect to SQL Server. Proceeding with default seed.");
                        return;
                    }

                    var roles = sqlContext.Roles.AsNoTracking().ToList();
                    if (roles.Any() && !sqliteContext.Roles.Any())
                    {
                        sqliteContext.Roles.AddRange(roles);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {roles.Count} roles.");
                    }

                    var users = sqlContext.Users.AsNoTracking().ToList();
                    if (users.Any() && !sqliteContext.Users.Any())
                    {
                        sqliteContext.Users.AddRange(users);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {users.Count} users.");
                    }

                    var userRoles = sqlContext.UserRoles.AsNoTracking().ToList();
                    if (userRoles.Any() && !sqliteContext.UserRoles.Any())
                    {
                        sqliteContext.UserRoles.AddRange(userRoles);
                        sqliteContext.SaveChanges();
                    }

                    var productGroups = sqlContext.ProductGroups.Include(pg => pg.Subsystems).AsNoTracking().ToList();
                    if (productGroups.Any() && !sqliteContext.ProductGroups.Any())
                    {
                        sqliteContext.ProductGroups.AddRange(productGroups);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {productGroups.Count} product groups.");
                    }

                    var projects = sqlContext.Projects.AsNoTracking().ToList();
                    if (projects.Any())
                    {
                        sqliteContext.Projects.AddRange(projects);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {projects.Count} projects.");
                    }

                    var tasks = sqlContext.Tasks.AsNoTracking().ToList();
                    if (tasks.Any())
                    {
                        sqliteContext.Tasks.AddRange(tasks);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {tasks.Count} tasks.");
                    }

                    var notes = sqlContext.Notes.AsNoTracking().ToList();
                    if (notes.Any())
                    {
                        sqliteContext.Notes.AddRange(notes);
                        sqliteContext.SaveChanges();
                        Console.WriteLine($"[DataMigrator] Migrated {notes.Count} notes.");
                    }

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
                    }

                    var meetings = sqlContext.Meetings.AsNoTracking().ToList();
                    if (meetings.Any())
                    {
                        sqliteContext.Meetings.AddRange(meetings);
                        sqliteContext.SaveChanges();
                    }

                    var plans = sqlContext.WeeklyPlans.AsNoTracking().ToList();
                    if (plans.Any())
                    {
                        sqliteContext.WeeklyPlans.AddRange(plans);
                        sqliteContext.SaveChanges();
                    }

                    Console.WriteLine("==================================================");
                    Console.WriteLine("✅ [DataMigrator] Migration from SQL Server to SQLite COMPLETED SUCCESSFULLY!");
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