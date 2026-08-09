using Microsoft.EntityFrameworkCore;
using Payvast.API.Models;

namespace Payvast.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Models.Task> Tasks { get; set; }
        public DbSet<Note> Notes { get; set; }
        public DbSet<ChatChannel> ChatChannels { get; set; }
        public DbSet<ChatChannelMember> ChatChannelMembers { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<ProductGroup> ProductGroups { get; set; }
        public DbSet<Subsystem> Subsystems { get; set; }
        public DbSet<TaskTemplate> TaskTemplates { get; set; }
        public DbSet<UnreadMessage> UnreadMessages { get; set; }
        public DbSet<MessageReaction> MessageReactions { get; set; }
        public DbSet<CrmStatusRule> CrmStatusRules { get; set; }
        public DbSet<CrmReport> CrmReports { get; set; }
        public DbSet<CrmProjectCache> CrmProjectCache { get; set; }
        public DbSet<CrmAction> CrmActions { get; set; }
        public DbSet<ProjectChecklist> ProjectChecklists { get; set; }
        public DbSet<WeeklyPlan> WeeklyPlans { get; set; }
        public DbSet<ProjectFollowUp> ProjectFollowUps { get; set; }
        public DbSet<UserSetting> UserSettings { get; set; }
        public DbSet<HashtagRule> HashtagRules { get; set; }
        public DbSet<ProjectStepTemplate> ProjectStepTemplates { get; set; }
        public DbSet<ProjectDocument> ProjectDocuments { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }

        public DbSet<FormTemplate> FormTemplates { get; set; }
        public DbSet<ReportTemplate> ReportTemplates { get; set; }
        public DbSet<FormStepTemplate> FormStepTemplates { get; set; }
        public DbSet<ReportStepTemplate> ReportStepTemplates { get; set; }
        public DbSet<ProjectForm> ProjectForms { get; set; }
        public DbSet<ProjectReport> ProjectReports { get; set; }
        public DbSet<Meeting> Meetings { get; set; }
        public DbSet<ProjectHourLog> ProjectHourLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<UserRole>().HasKey(ur => new { ur.UserId, ur.RoleId });
            modelBuilder.Entity<UserRole>().HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId).IsRequired();
            modelBuilder.Entity<UserRole>().HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId).IsRequired();

            modelBuilder.Entity<Project>().HasOne(p => p.ProjectManager).WithMany().HasForeignKey(p => p.ProjectManagerId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Project>().HasOne(p => p.ProjectAssignee).WithMany().HasForeignKey(p => p.ProjectAssigneeId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Project>().HasOne(p => p.CreatedBy).WithMany().HasForeignKey(p => p.CreatedById).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Project>().HasOne(p => p.LastEditor).WithMany().HasForeignKey(p => p.LastEditorId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Project>().HasOne(p => p.ParentProject).WithMany(p => p.SubProjects).HasForeignKey(p => p.ParentProjectId).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Models.Task>(entity =>
            {
                entity.HasOne(t => t.ParentTask).WithMany(t => t.SubTasks).HasForeignKey(t => t.ParentTaskId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(t => t.Assignee).WithMany().HasForeignKey(t => t.AssigneeId).OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(t => t.CreatedBy).WithMany().HasForeignKey(t => t.CreatedById).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(t => t.ChecklistStep).WithMany().HasForeignKey(t => t.ChecklistStepId).OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ChatChannelMember>().HasKey(cm => new { cm.ChannelId, cm.UserId });
            modelBuilder.Entity<ChatChannelMember>().HasOne(cm => cm.Channel).WithMany(c => c.Members).HasForeignKey(cm => cm.ChannelId);
            modelBuilder.Entity<ChatChannelMember>().HasOne(cm => cm.User).WithMany().HasForeignKey(cm => cm.UserId);

            modelBuilder.Entity<UnreadMessage>().HasOne(um => um.User).WithMany().HasForeignKey(um => um.UserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<UnreadMessage>().HasOne(um => um.Message).WithMany().HasForeignKey(um => um.MessageId).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MessageReaction>(entity =>
            {
                entity.HasKey(mr => mr.Id);
                entity.HasOne(mr => mr.Message).WithMany(m => m.Reactions).HasForeignKey(mr => mr.MessageId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(mr => mr.User).WithMany().HasForeignKey(mr => mr.UserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CrmReport>().HasOne(r => r.Project).WithMany().HasForeignKey(r => r.ProjectId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<CrmAction>().HasOne(a => a.Project).WithMany().HasForeignKey(a => a.ProjectId).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectChecklist>(entity =>
            {
                entity.HasKey(pc => pc.Id);
                entity.HasOne(pc => pc.Project).WithMany(p => p.Checklists).HasForeignKey(pc => pc.ProjectId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(pc => pc.CompletedBy).WithMany().HasForeignKey(pc => pc.CompletedByUserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<WeeklyPlan>(entity =>
            {
                entity.HasKey(w => w.Id);
                entity.HasOne(w => w.User).WithMany().HasForeignKey(w => w.UserId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(w => w.Task).WithMany().HasForeignKey(w => w.TaskId).OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ProjectFollowUp>(entity =>
            {
                entity.HasKey(f => f.Id);
                entity.HasOne(f => f.Project).WithMany().HasForeignKey(f => f.ProjectId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(f => f.User).WithMany().HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<UserSetting>(entity =>
            {
                entity.HasKey(us => us.Id);
                entity.HasOne(us => us.User).WithMany().HasForeignKey(us => us.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<HashtagRule>(entity =>
            {
                entity.HasKey(hr => hr.Id);
            });

            modelBuilder.Entity<ProjectStepTemplate>(entity =>
            {
                entity.HasKey(pst => pst.Id);
                entity.HasOne(pst => pst.ProductGroup).WithMany().HasForeignKey(pst => pst.ProductGroupId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProjectDocument>(entity =>
            {
                entity.HasKey(d => d.Id);
                entity.HasOne(d => d.Project).WithMany().HasForeignKey(d => d.ProjectId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(d => d.UploadedBy).WithMany().HasForeignKey(d => d.UploadedByUserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<SystemSetting>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<FormTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<ReportTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<FormStepTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.FormTemplate).WithMany(f => f.Steps).HasForeignKey(e => e.FormTemplateId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ReportStepTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.ReportTemplate).WithMany(r => r.Steps).HasForeignKey(e => e.ReportTemplateId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProjectForm>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Project).WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.FormTemplate).WithMany(f => f.ProjectForms).HasForeignKey(e => e.FormTemplateId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.AssignedToUser).WithMany().HasForeignKey(e => e.AssignedToUserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ProjectReport>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Project).WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.ReportTemplate).WithMany(r => r.ProjectReports).HasForeignKey(e => e.ReportTemplateId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.AssignedToUser).WithMany().HasForeignKey(e => e.AssignedToUserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Meeting>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Project).WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ProjectHourLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Project).WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.ChangedByUser).WithMany().HasForeignKey(e => e.ChangedByUserId).OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}