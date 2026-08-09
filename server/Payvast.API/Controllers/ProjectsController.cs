using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using System.Linq;
using System.Collections.Generic;
using System;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public ProjectsController(ApplicationDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectCardDto>>> GetProjects()
        {
            var allProjectDtos = await (
                from p in _context.Projects
                select new ProjectCardDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    CrmCode = p.CrmCode,
                    Status = p.Status,
                    CustomStatus = p.CustomStatus,
                    Progress = p.Progress,
                    Weight = p.Weight,
                    ProductGroup = p.ProductGroup,
                    Color = p.Color ?? "#64748b",
                    ProjectAssigneeId = p.ProjectAssigneeId,
                    ProjectAssigneeName = p.ProjectAssignee != null ? p.ProjectAssignee.FullName : null,
                    ProjectAssigneeAvatarUrl = p.ProjectAssignee != null ? p.ProjectAssignee.AvatarUrl : null,
                    _ParentProjectId = p.ParentProjectId,
                    SubProjects = new List<SubProjectTagDto>(),
                    IsDelivered = p.IsDelivered
                })
                .AsNoTracking()
                .ToListAsync();

            var projectDict = allProjectDtos.ToDictionary(p => p.Id);
            var rootProjects = new List<ProjectCardDto>();

            foreach (var dto in allProjectDtos)
            {
                if (dto._ParentProjectId.HasValue && projectDict.ContainsKey(dto._ParentProjectId.Value))
                {
                    projectDict[dto._ParentProjectId.Value].SubProjects.Add(new SubProjectTagDto
                    {
                        Id = dto.Id,
                        Title = dto.Title,
                        ProductGroup = dto.ProductGroup
                    });
                }
                else
                {
                    rootProjects.Add(dto);
                }
            }

            return Ok(rootProjects);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectDetailDto>> GetProjectById(int id)
        {
            var project = await _context.Projects
                .Include(p => p.SubProjects)
                    .ThenInclude(sp => sp.ProjectAssignee)
                .Include(p => p.ProjectManager)
                .Include(p => p.ProjectAssignee)
                .Include(p => p.CreatedBy)
                .Include(p => p.Checklists)
                    .ThenInclude(c => c.CompletedBy)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null) return NotFound("Project not found.");

            int calculatedProgress = project.Progress;
            if (project.SubProjects.Any())
            {
                int totalWeight = project.SubProjects.Sum(sp => sp.Weight ?? 0);
                if (totalWeight > 0)
                {
                    var weightedProgressSum = project.SubProjects.Sum(sp => sp.Progress * (sp.Weight ?? 0));
                    calculatedProgress = weightedProgressSum / totalWeight;
                }
                else
                {
                    calculatedProgress = (int)project.SubProjects.Average(sp => sp.Progress);
                }
            }

            var projectDetail = new ProjectDetailDto
            {
                Id = project.Id,
                Title = project.Title,
                CrmCode = project.CrmCode,
                Description = project.Description,
                Status = project.Status,
                CustomStatus = project.CustomStatus,
                BlockedBy = project.BlockedBy,
                BlockedReason = project.BlockedReason,
                CalculatedProgress = calculatedProgress,
                BuyerName = project.BuyerName,
                ProjectManagerName = project.ProjectManager?.FullName,
                ProjectAssigneeId = project.ProjectAssigneeId,
                ProjectAssigneeName = project.ProjectAssignee?.FullName,
                ProductGroup = project.ProductGroup,
                ProjectStage = project.ProjectStage,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                Credit = project.Credit,
                CommittedHours = project.CommittedHours,
                CreatorName = project.CreatedBy?.FullName,
                ParentProjectId = project.ParentProjectId,
                SubProjects = project.SubProjects.Select(sp => new ProjectCardDto
                {
                    Id = sp.Id,
                    Title = sp.Title,
                    CrmCode = sp.CrmCode,
                    Status = sp.Status,
                    CustomStatus = sp.CustomStatus,
                    Progress = sp.Progress,
                    Weight = sp.Weight,
                    ProductGroup = sp.ProductGroup,
                    Color = sp.Color ?? "#64748b",
                    ProjectAssigneeId = sp.ProjectAssigneeId,
                    ProjectAssigneeName = sp.ProjectAssignee != null ? sp.ProjectAssignee.FullName : null,
                    ProjectAssigneeAvatarUrl = sp.ProjectAssignee != null ? sp.ProjectAssignee.AvatarUrl : null,
                    IsDelivered = sp.IsDelivered
                }).ToList(),
                Checklists = project.Checklists.Select(c => new ProjectChecklistDto
                {
                    Id = c.Id,
                    StepName = c.StepName,
                    IsCompleted = c.IsCompleted,
                    CompletedAt = c.CompletedAt,
                    CompletedByUserId = c.CompletedByUserId,
                    CompletedByName = c.CompletedBy != null ? c.CompletedBy.FullName : null
                }).ToList()
            };

            return Ok(projectDetail);
        }

        [HttpGet("flat")]
        public async Task<IActionResult> GetProjectsFlat()
        {
            var projects = await _context.Projects
                .AsNoTracking()
                .Select(p => new { p.Id, p.Title })
                .ToListAsync();
            return Ok(projects);
        }

        [HttpPost]
        public async Task<ActionResult<ProjectCardDto>> CreateProject(CreateProjectDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var project = new Project
                {
                    ParentProjectId = dto.ParentProjectId,
                    Weight = dto.Weight,
                    CrmCode = dto.CrmCode,
                    Title = dto.Title,
                    BuyerName = dto.BuyerName,
                    ProjectManagerId = dto.ProjectManagerId ?? userId,
                    ProjectAssigneeId = dto.ProjectAssigneeId,
                    ProductGroup = dto.ProductGroup,
                    SystemType = dto.SystemType,
                    ProjectStage = dto.ProjectStage,
                    Status = dto.Status ?? "Planned",
                    CustomStatus = dto.CustomStatus,
                    Complexity = dto.Complexity,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    Credit = dto.Credit,
                    CommittedHours = dto.CommittedHours,
                    Description = dto.Description,
                    Color = dto.Color,
                    Progress = 0,
                    CreatedAt = DateTime.UtcNow,
                    CreatedById = userId,
                    IsDelivered = false
                };

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                if (project.ParentProjectId.HasValue)
                {
                    await ApplyDefaultTemplate(project.Id, "Default Form", userId);
                }
                else if (!string.IsNullOrEmpty(project.ProductGroup))
                {
                    var productGroup = await _context.ProductGroups.FirstOrDefaultAsync(pg => pg.Name == project.ProductGroup);
                    if (productGroup != null)
                    {
                        var stepTemplates = await _context.ProjectStepTemplates
                            .Where(pst => pst.ProductGroupId == productGroup.Id && pst.IsActive)
                            .OrderBy(pst => pst.DisplayOrder)
                            .ToListAsync();
                        foreach (var step in stepTemplates)
                        {
                            _context.ProjectChecklists.Add(new ProjectChecklist
                            {
                                ProjectId = project.Id,
                                StepName = step.StepName,
                                IsCompleted = false
                            });
                        }
                        await _context.SaveChangesAsync();
                    }
                }

                if (!project.ParentProjectId.HasValue)
                {
                    var projectChannel = new ChatChannel
                    {
                        Name = $"Project: {project.Title}",
                        ChannelType = "Project",
                        ProjectId = project.Id,
                        IsPrivate = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ChatChannels.Add(projectChannel);
                    await _context.SaveChangesAsync();

                    var members = new List<ChatChannelMember>
                    {
                        new ChatChannelMember { ChannelId = projectChannel.Id, UserId = project.ProjectManagerId }
                    };
                    if (project.CreatedById != project.ProjectManagerId)
                    {
                        members.Add(new ChatChannelMember { ChannelId = projectChannel.Id, UserId = project.CreatedById });
                    }
                    _context.ChatChannelMembers.AddRange(members);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                var resultDto = new ProjectCardDto
                {
                    Id = project.Id,
                    Title = project.Title,
                    CrmCode = project.CrmCode,
                    Status = project.Status,
                    CustomStatus = project.CustomStatus,
                    Progress = project.Progress,
                    ProductGroup = project.ProductGroup,
                    Color = project.Color,
                    ProjectAssigneeId = project.ProjectAssigneeId,
                    ProjectAssigneeName = project.ProjectAssignee != null ? project.ProjectAssignee.FullName : null,
                    ProjectAssigneeAvatarUrl = project.ProjectAssignee != null ? project.ProjectAssignee.AvatarUrl : null,
                    IsDelivered = false
                };
                return CreatedAtAction(nameof(GetProjects), new { id = project.Id }, resultDto);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error creating project: {ex.Message}");
            }
        }

        private async Task ApplyDefaultTemplate(int subProjectId, string templateName, int userId)
        {
            var formTemplate = await _context.FormTemplates.Include(f => f.Steps).FirstOrDefaultAsync(f => f.Name == templateName);
            if (formTemplate != null)
            {
                await CreateStepsAndTasksFromTemplate(subProjectId, formTemplate.Steps, null, userId);
                return;
            }

            var reportTemplate = await _context.ReportTemplates.Include(r => r.Steps).FirstOrDefaultAsync(r => r.Name == templateName);
            if (reportTemplate != null)
            {
                await CreateStepsAndTasksFromTemplate(subProjectId, reportTemplate.Steps, null, userId);
            }
        }

        [HttpGet("{id}/available-forms")]
        public async Task<IActionResult> GetAvailableFormsForProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            var forms = await _context.FormTemplates
                .Include(f => f.Steps)
                .Where(f => f.IsActive)
                .Select(f => new { f.Id, f.Name, f.Color, Steps = f.Steps.OrderBy(s => s.StepOrder).ToList() })
                .ToListAsync();

            var reports = await _context.ReportTemplates
                .Include(r => r.Steps)
                .Where(r => r.IsActive)
                .Select(r => new { r.Id, r.Name, r.Color, Steps = r.Steps.OrderBy(s => s.StepOrder).ToList() })
                .ToListAsync();

            var users = await _context.Users
                .Where(u => u.IsActive)
                .Select(u => new { u.Id, u.FullName })
                .ToListAsync();

            return Ok(new
            {
                ProjectId = id,
                ProjectTitle = project.Title,
                CrmCode = project.CrmCode,
                ProjectAssigneeId = project.ProjectAssigneeId ?? project.ProjectManagerId,
                Forms = forms,
                Reports = reports,
                Users = users
            });
        }

        [HttpPost("{id}/generate-from-forms")]
        public async Task<IActionResult> GenerateSubProjectsFromForms(int id, [FromBody] GenerateFromFormsDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(new { error = "Invalid input payload." });

                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var parentProject = await _context.Projects.FindAsync(id);
                if (parentProject == null)
                    return NotFound(new { error = "Parent project not found." });

                await using var transaction = await _context.Database.BeginTransactionAsync();
                var createdSubProjects = new List<object>();

                foreach (var formItem in dto.SelectedForms)
                {
                    bool isCustom = formItem.FormTemplateId < 0;
                    string title = isCustom ? formItem.CustomName : "";
                    string color = "#a855f7";
                    
                    if (!isCustom)
                    {
                        var template = await _context.FormTemplates.FindAsync(formItem.FormTemplateId);
                        title = template.Name;
                        color = template.Color;
                    }

                    var subProject = CreateSubProjectFromTemplate(parentProject, title, color, formItem.AssignedToUserId, userId);
                    _context.Projects.Add(subProject);
                    await _context.SaveChangesAsync();

                    if (isCustom)
                    {
                        await ApplyDefaultTemplate(subProject.Id, "Default Form", userId);
                    }
                    else
                    {
                        var template = await _context.FormTemplates.Include(f => f.Steps).FirstOrDefaultAsync(f => f.Id == formItem.FormTemplateId);
                        await CreateStepsAndTasksFromTemplate(subProject.Id, template.Steps, formItem.AssignedToUserId ?? parentProject.ProjectAssigneeId, userId);
                    }

                    createdSubProjects.Add(new { subProject.Id, subProject.Title });
                }

                foreach (var reportItem in dto.SelectedReports)
                {
                    bool isCustom = reportItem.ReportTemplateId < 0;
                    string title = reportItem.CustomName;
                    string color = "#f97316";

                    if (!isCustom)
                    {
                        var template = await _context.ReportTemplates.FindAsync(reportItem.ReportTemplateId);
                        title = template.Name;
                        color = template.Color;
                    }

                    var subProject = CreateSubProjectFromTemplate(parentProject, title, color, reportItem.AssignedToUserId, userId);
                    _context.Projects.Add(subProject);
                    await _context.SaveChangesAsync();

                    if (isCustom)
                    {
                        await ApplyDefaultTemplate(subProject.Id, "Default General Report", userId);
                    }
                    else
                    {
                        var template = await _context.ReportTemplates.Include(r => r.Steps).FirstOrDefaultAsync(r => r.Id == reportItem.ReportTemplateId);
                        await CreateStepsAndTasksFromTemplate(subProject.Id, template.Steps, reportItem.AssignedToUserId ?? parentProject.ProjectAssigneeId, userId);
                    }

                    createdSubProjects.Add(new { subProject.Id, subProject.Title });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { Message = "Sub-projects generated successfully.", Count = createdSubProjects.Count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        private Project CreateSubProjectFromTemplate(Project parent, string title, string color, int? assigneeId, int userId)
        {
            return new Project
            {
                ParentProjectId = parent.Id,
                Title = title,
                ProductGroup = parent.ProductGroup,
                ProjectManagerId = parent.ProjectManagerId,
                ProjectAssigneeId = assigneeId ?? parent.ProjectAssigneeId,
                CrmCode = parent.CrmCode,
                BuyerName = parent.BuyerName,
                Status = "Planned",
                StartDate = parent.StartDate,
                EndDate = parent.EndDate,
                Credit = parent.Credit,
                CommittedHours = parent.CommittedHours,
                Color = color,
                Progress = 0,
                CreatedAt = DateTime.UtcNow,
                CreatedById = userId,
                IsDelivered = false
            };
        }

        private async Task CreateStepsAndTasksFromTemplate(int subProjectId, IEnumerable<dynamic> steps, int? defaultAssigneeId, int userId)
        {
            foreach (var step in steps.OrderBy(s => s.StepOrder))
            {
                var checklist = new ProjectChecklist { ProjectId = subProjectId, StepName = step.StepName, IsCompleted = false };
                _context.ProjectChecklists.Add(checklist);
                await _context.SaveChangesAsync();

                for (int i = 1; i <= step.RequiredSessions; i++)
                {
                    _context.Tasks.Add(new Payvast.API.Models.Task
                    {
                        ProjectId = subProjectId,
                        Title = $"{step.StepName} - Session {i}",
                        TaskType = "TASK",
                        Status = "ToDo",
                        Priority = "Medium",
                        ChecklistStepId = checklist.Id,
                        DisplayOrder = i,
                        CreatedAt = DateTime.UtcNow,
                        CreatedById = userId,
                        StartDate = DateTime.UtcNow.AddDays(i),
                        EstimatedHours = step.DefaultHoursPerSession,
                        AllocatedHours = 0,
                        AssigneeId = defaultAssigneeId
                    });
                }
            }
            await _context.SaveChangesAsync();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            await DeleteProjectAndSubProjectsRecursive(id);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async System.Threading.Tasks.Task DeleteProjectAndSubProjectsRecursive(int projectId)
        {
            var subProjects = await _context.Projects.Where(p => p.ParentProjectId == projectId).ToListAsync();
            foreach (var sub in subProjects) await DeleteProjectAndSubProjectsRecursive(sub.Id);
            var tasks = await _context.Tasks.Where(t => t.ProjectId == projectId).ToListAsync();
            if (tasks.Any()) _context.Tasks.RemoveRange(tasks);
            var docs = await _context.ProjectDocuments.Where(d => d.ProjectId == projectId).ToListAsync();
            if (docs.Any()) _context.ProjectDocuments.RemoveRange(docs);
            var checklists = await _context.ProjectChecklists.Where(c => c.ProjectId == projectId).ToListAsync();
            if (checklists.Any()) _context.ProjectChecklists.RemoveRange(checklists);
            var followUps = await _context.ProjectFollowUps.Where(f => f.ProjectId == projectId).ToListAsync();
            if (followUps.Any()) _context.ProjectFollowUps.RemoveRange(followUps);
            var channel = await _context.ChatChannels.FirstOrDefaultAsync(c => c.ProjectId == projectId);
            if (channel != null) _context.ChatChannels.Remove(channel);
            var project = await _context.Projects.FindAsync(projectId);
            if (project != null) _context.Projects.Remove(project);
        }

        [HttpPost("batch-create-subprojects")]
        public async Task<IActionResult> BatchCreateSubProjects([FromBody] BatchCreateSubProjectDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var parentProject = await _context.Projects.Include(p => p.ProjectAssignee).FirstOrDefaultAsync(p => p.Id == dto.ParentProjectId);
            if (parentProject == null) return NotFound("Parent project not found.");
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var newProjects = new List<Project>();
                foreach (var item in dto.SubProjects)
                {
                    var subProject = new Project
                    {
                        ParentProjectId = parentProject.Id,
                        Title = item.Title,
                        ProductGroup = item.ProductGroup,
                        ProjectManagerId = item.ProjectManagerId,
                        ProjectAssigneeId = parentProject.ProjectAssigneeId,
                        CrmCode = parentProject.CrmCode,
                        BuyerName = parentProject.BuyerName,
                        Status = "Planned",
                        StartDate = parentProject.StartDate,
                        EndDate = parentProject.EndDate,
                        Credit = parentProject.Credit,
                        CommittedHours = parentProject.CommittedHours,
                        SystemType = parentProject.SystemType,
                        ProjectStage = parentProject.ProjectStage,
                        Complexity = parentProject.Complexity,
                        Description = $"Sub-project created from {parentProject.Title}",
                        Color = !string.IsNullOrEmpty(item.Color) ? item.Color : parentProject.Color,
                        Progress = 0,
                        CreatedAt = DateTime.UtcNow,
                        CreatedById = userId,
                        IsDelivered = false
                    };
                    _context.Projects.Add(subProject);
                    await _context.SaveChangesAsync();

                    if (!string.IsNullOrEmpty(subProject.ProductGroup))
                    {
                        var productGroup = await _context.ProductGroups.FirstOrDefaultAsync(pg => pg.Name == subProject.ProductGroup);
                        if (productGroup != null)
                        {
                            var stepTemplatesForSub = await _context.ProjectStepTemplates.Where(pst => pst.ProductGroupId == productGroup.Id && pst.IsActive).OrderBy(pst => pst.DisplayOrder).ToListAsync();
                            foreach (var step in stepTemplatesForSub)
                            {
                                _context.ProjectChecklists.Add(new ProjectChecklist { ProjectId = subProject.Id, StepName = step.StepName, IsCompleted = false });
                            }
                            await _context.SaveChangesAsync();
                        }
                    }

                    if (item.SubsystemIds != null && item.SubsystemIds.Any())
                    {
                        var templates = await _context.TaskTemplates.Where(t => item.SubsystemIds.Contains(t.SubsystemId)).ToListAsync();
                        foreach (var template in templates)
                        {
                            _context.Tasks.Add(new Payvast.API.Models.Task
                            {
                                ProjectId = subProject.Id,
                                Title = template.Title,
                                Priority = "Medium",
                                Status = "ToDo",
                                TaskType = "TASK",
                                TaskTemplateId = template.Id,
                                CreatedAt = DateTime.UtcNow,
                                CreatedById = userId,
                                StartDate = DateTime.UtcNow,
                                DueDate = DateTime.UtcNow.AddDays(template.DefaultDurationInDays > 0 ? template.DefaultDurationInDays : 3),
                                AssigneeId = dto.DefaultAssigneeId ?? subProject.ProjectAssigneeId
                            });
                        }
                        await _context.SaveChangesAsync();
                    }
                    newProjects.Add(subProject);
                }
                await transaction.CommitAsync();
                return Ok(new { Count = newProjects.Count, Message = "Sub-projects and associated tasks generated successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error creating sub-projects: {ex.Message}");
            }
        }

        [HttpPut("{id}/checklist")]
        public async Task<IActionResult> UpdateChecklist(int id, [FromBody] UpdateChecklistDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var checklistItem = await _context.ProjectChecklists.FirstOrDefaultAsync(c => c.ProjectId == id && c.StepName == dto.StepName);
            if (checklistItem == null) return NotFound();
            checklistItem.IsCompleted = dto.IsCompleted;
            checklistItem.CompletedAt = dto.IsCompleted ? DateTime.UtcNow : (DateTime?)null;
            checklistItem.CompletedByUserId = dto.IsCompleted ? userId : (int?)null;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{id}/checklists")]
        public async Task<IActionResult> GetProjectChecklists(int id)
        {
            var checklists = await _context.ProjectChecklists.Where(c => c.ProjectId == id).OrderBy(c => c.Id).Select(c => new { c.Id, c.StepName, c.IsCompleted }).ToListAsync();
            return Ok(checklists);
        }

        [HttpPost("{id}/sync-steps")]
        public async Task<IActionResult> SyncProjectSteps(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound("Project not found.");
            if (string.IsNullOrEmpty(project.ProductGroup)) return BadRequest("Product group is not configured for this project.");
            var productGroup = await _context.ProductGroups.FirstOrDefaultAsync(pg => pg.Name == project.ProductGroup);
            if (productGroup == null) return BadRequest($"Product group '{project.ProductGroup}' is not defined in system.");
            var stepTemplates = await _context.ProjectStepTemplates.Where(pst => pst.ProductGroupId == productGroup.Id && pst.IsActive).OrderBy(pst => pst.DisplayOrder).ToListAsync();
            if (!stepTemplates.Any()) return BadRequest("No active step templates defined for this product group.");
            var existingSteps = await _context.ProjectChecklists.Where(c => c.ProjectId == id).ToListAsync();
            _context.ProjectChecklists.RemoveRange(existingSteps);
            foreach (var step in stepTemplates)
            {
                _context.ProjectChecklists.Add(new ProjectChecklist { ProjectId = id, StepName = step.StepName, IsCompleted = false });
            }
            await _context.SaveChangesAsync();
            return Ok(new { Message = $"{stepTemplates.Count} steps synchronized successfully." });
        }

        [HttpGet("{id}/deliverables")]
        public async Task<IActionResult> GetDeliverableSubProjects(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            var deliverables = await _context.Projects
                .Where(p => p.ParentProjectId == id && p.Progress >= 100)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.Progress,
                    p.Color,
                    ProjectAssigneeName = p.ProjectAssignee != null ? p.ProjectAssignee.FullName : null,
                    CompletedAt = p.EndDate,
                    IsDelivered = p.IsDelivered
                })
                .ToListAsync();

            return Ok(deliverables);
        }

        [HttpPut("{id}/deliver")]
        public async Task<IActionResult> MarkAsDelivered(int id, [FromBody] DeliverProjectDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            if (project.Progress < 100)
                return BadRequest("Sub-project is not completed yet.");

            var parentProject = await _context.Projects.FindAsync(project.ParentProjectId);
            if (parentProject == null) return BadRequest("This project has no parent project.");

            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");
            if (!isAdmin && parentProject.ProjectManagerId != userId)
                return Forbid();

            project.IsDelivered = dto.IsDelivered;
            await _context.SaveChangesAsync();

            return Ok(new { project.Id, project.IsDelivered });
        }

        [HttpPost("{id}/steps")]
        public async Task<IActionResult> AddStepToProject(int id, [FromBody] AddStepDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound("Project not found.");

            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");
            if (!isAdmin && project.ProjectManagerId != userId)
                return Forbid();

            var checklist = new ProjectChecklist
            {
                ProjectId = id,
                StepName = dto.StepName,
                IsCompleted = false
            };
            _context.ProjectChecklists.Add(checklist);
            await _context.SaveChangesAsync();

            for (int i = 1; i <= dto.RequiredSessions; i++)
            {
                var task = new Payvast.API.Models.Task
                {
                    ProjectId = id,
                    Title = $"{dto.StepName} - Session {i}",
                    TaskType = "TASK",
                    Status = "ToDo",
                    Priority = "Medium",
                    ChecklistStepId = checklist.Id,
                    DisplayOrder = i,
                    CreatedAt = DateTime.UtcNow,
                    CreatedById = userId,
                    StartDate = DateTime.UtcNow.AddDays(i),
                    EstimatedHours = dto.DefaultHoursPerSession,
                    AllocatedHours = 0,
                    AssigneeId = project.ProjectAssigneeId
                };
                _context.Tasks.Add(task);
            }
            await _context.SaveChangesAsync();

            return Ok(new { checklist.Id, checklist.StepName });
        }

        [HttpPost("{id}/steps/{stepId}/complete")]
        public async Task<IActionResult> ForceCompleteStep(int id, int stepId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var step = await _context.ProjectChecklists.FirstOrDefaultAsync(c => c.Id == stepId && c.ProjectId == id);
            if (step == null) return NotFound();

            var tasks = await _context.Tasks.Where(t => t.ChecklistStepId == stepId && t.ProjectId == id).ToListAsync();
            foreach (var task in tasks)
            {
                task.Status = "Done";
            }

            step.IsCompleted = true;
            step.CompletedAt = DateTime.UtcNow;
            step.CompletedByUserId = userId;

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Step completed successfully." });
        }

        public class GenerateFromFormsDto
        {
            public List<SelectedFormItem> SelectedForms { get; set; }
            public List<SelectedReportItem> SelectedReports { get; set; }
        }

        public class SelectedFormItem
        {
            public int FormTemplateId { get; set; }
            public int? AssignedToUserId { get; set; }
            public string CustomName { get; set; }
        }

        public class SelectedReportItem
        {
            public int ReportTemplateId { get; set; }
            public int? AssignedToUserId { get; set; }
            public string CustomName { get; set; }
        }

        public class DeliverProjectDto
        {
            public bool IsDelivered { get; set; }
        }

        public class AddStepDto
        {
            public string StepName { get; set; }
            public int RequiredSessions { get; set; }
            public int DefaultHoursPerSession { get; set; }
        }
    }
}