using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using System.Globalization;
using System.Collections.Generic;
using System.Linq;
using System;
using TaskModel = Payvast.API.Models.Task;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/projects/{projectId}/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TasksController> _logger;

        public TasksController(ApplicationDbContext context, ILogger<TasksController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private async System.Threading.Tasks.Task SyncProjectProgress(int projectId)
        {
            var project = await _context.Projects
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return;

            var ganttTasks = project.Tasks.Where(t => t.TaskType == "GANTT").ToList();
            if (ganttTasks.Any())
            {
                double totalWeight = ganttTasks.Sum(t => t.Weight ?? 1);
                double weightedProgressSum = ganttTasks.Sum(t => t.Progress * (t.Weight ?? 1));
                if (totalWeight > 0)
                    project.Progress = (int)Math.Round(weightedProgressSum / totalWeight);
            }
            else
            {
                var kanbanTasks = project.Tasks.Where(t => t.TaskType == "TASK").ToList();
                if (kanbanTasks.Any())
                {
                    var doneCount = kanbanTasks.Count(t => t.Status == "Done");
                    project.Progress = (int)Math.Round((double)doneCount / kanbanTasks.Count * 100);
                }
            }

            if (project.Progress >= 100 && project.Status != "Completed")
                project.Status = "Completed";

            await _context.SaveChangesAsync();
            if (project.ParentProjectId.HasValue)
                await SyncParentProjectProgress(project.ParentProjectId.Value);
        }

        private async System.Threading.Tasks.Task SyncParentProjectProgress(int parentId)
        {
            var parent = await _context.Projects
                .Include(p => p.SubProjects)
                .FirstOrDefaultAsync(p => p.Id == parentId);
            if (parent == null || !parent.SubProjects.Any()) return;

            double totalWeight = parent.SubProjects.Sum(sp => sp.Weight ?? 1);
            double weightedProgressSum = parent.SubProjects.Sum(sp => sp.Progress * (sp.Weight ?? 1));
            if (totalWeight > 0)
            {
                parent.Progress = (int)Math.Round(weightedProgressSum / totalWeight);
                if (parent.Progress >= 100 && parent.Status != "Completed")
                    parent.Status = "Completed";
                await _context.SaveChangesAsync();
            }
        }

        private async System.Threading.Tasks.Task UpdateStepCompletionStatus(int projectId, int checklistStepId)
        {
            var step = await _context.ProjectChecklists.FindAsync(checklistStepId);
            if (step == null) return;

            var tasksInStep = await _context.Tasks
                .Where(t => t.ProjectId == projectId && t.ChecklistStepId == checklistStepId && t.TaskType == "TASK")
                .ToListAsync();

            bool allCompleted = tasksInStep.All(t => t.Status == "Done");
            if (allCompleted != step.IsCompleted)
            {
                step.IsCompleted = allCompleted;
                step.CompletedAt = allCompleted ? DateTime.UtcNow : (DateTime?)null;
                await _context.SaveChangesAsync();
            }
        }

        private DateTime? ParseDateAsUtc(string dateStr)
        {
            if (string.IsNullOrWhiteSpace(dateStr)) return null;
            try
            {
                var parts = dateStr.Split(new char[] { '/', '-' }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length != 3) return null;
                int year = int.Parse(parts[0]);
                int month = int.Parse(parts[1]);
                int day = int.Parse(parts[2]);

                if (year > 1600)
                {
                    return new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);
                }
                else
                {
                    var gDate = new PersianCalendar().ToDateTime(year, month, day, 0, 0, 0, 0);
                    return TimeZoneInfo.ConvertTimeToUtc(gDate);
                }
            }
            catch { return null; }
        }

        [HttpGet("gantt")]
        public async Task<ActionResult<IEnumerable<GanttTaskDto>>> GetGanttTasksForProject(int projectId)
        {
            var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
            if (!projectExists) return NotFound("Project not found.");

            var ganttTasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId && t.TaskType == "GANTT")
                .OrderBy(t => t.StartDate)
                .Select(task => new GanttTaskDto
                {
                    Id = task.Id.ToString(),
                    Title = task.Title,
                    _StartDate = task.StartDate,
                    _EndDate = task.DueDate ?? task.StartDate.AddDays(1),
                    Progress = task.Progress,
                    Weight = task.Weight,
                    TotalUnits = task.TotalUnits,
                    CompletedUnits = task.CompletedUnits,
                    EstimatedHours = task.EstimatedHours,
                    AllocatedHours = task.AllocatedHours,
                    PlannedColor = task.TaskTemplate != null && task.TaskTemplate.Subsystem != null && task.TaskTemplate.Subsystem.ProductGroup != null
                        ? task.TaskTemplate.Subsystem.ProductGroup.Color ?? task.PlannedColor ?? "#3b82f6"
                        : task.PlannedColor ?? "#3b82f6",
                    ExecutedColor = task.ExecutedColor ?? "#10b981",
                    SubsystemId = task.TaskTemplate != null ? task.TaskTemplate.SubsystemId : (int?)null,
                    SubsystemName = task.TaskTemplate != null ? task.TaskTemplate.Subsystem.Name : null,
                    ProductGroupName = task.TaskTemplate != null && task.TaskTemplate.Subsystem.ProductGroup != null
                        ? task.TaskTemplate.Subsystem.ProductGroup.Name : null
                })
                .ToListAsync();

            foreach (var taskDto in ganttTasks)
            {
                var localStartDate = taskDto._StartDate.ToLocalTime();
                var localEndDate = taskDto._EndDate.ToLocalTime();
                taskDto.StartDate = localStartDate.ToString("yyyy/MM/dd");
                taskDto.EndDate = localEndDate.ToString("yyyy/MM/dd");
            }
            return Ok(ganttTasks);
        }

        [HttpPost("gantt")]
        public async Task<ActionResult<GanttTaskDto>> CreateGanttTask(int projectId, [FromBody] CreateOrUpdateGanttTaskDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
            if (!projectExists) return NotFound("Project not found.");

            var startDate = ParseDateAsUtc(dto.StartDate);
            var endDate = ParseDateAsUtc(dto.EndDate);
            if (!startDate.HasValue || !endDate.HasValue || endDate < startDate)
                return BadRequest("Invalid date format or range.");

            int totalUnits = dto.TotalUnits > 0 ? dto.TotalUnits : (int)(endDate.Value - startDate.Value).TotalDays + 1;
            int completedUnits = Math.Max(0, Math.Min(dto.CompletedUnits, totalUnits));
            int progress = totalUnits > 0 ? (int)Math.Round((double)completedUnits / totalUnits * 100) : 0;

            var task = new TaskModel
            {
                ProjectId = projectId,
                Title = dto.Title,
                StartDate = startDate.Value,
                DueDate = endDate.Value,
                Weight = dto.Weight,
                TotalUnits = totalUnits,
                CompletedUnits = completedUnits,
                Progress = progress,
                EstimatedHours = dto.EstimatedHours,
                AllocatedHours = dto.AllocatedHours,
                PlannedColor = dto.PlannedColor,
                ExecutedColor = dto.ExecutedColor,
                TaskType = "GANTT",
                Status = "ToDo",
                CreatedAt = DateTime.UtcNow,
                CreatedById = userId
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            await SyncProjectProgress(projectId);

            var localStartDate = task.StartDate.ToLocalTime();
            var localEndDate = (task.DueDate.Value).ToLocalTime();
            var createdTaskDto = new GanttTaskDto
            {
                Id = task.Id.ToString(),
                Title = task.Title,
                StartDate = localStartDate.ToString("yyyy/MM/dd"),
                EndDate = localEndDate.ToString("yyyy/MM/dd"),
                Progress = task.Progress,
                Weight = task.Weight,
                TotalUnits = task.TotalUnits,
                CompletedUnits = task.CompletedUnits,
                EstimatedHours = task.EstimatedHours,
                AllocatedHours = task.AllocatedHours,
                PlannedColor = task.PlannedColor,
                ExecutedColor = task.ExecutedColor
            };
            return CreatedAtAction(nameof(GetGanttTasksForProject), new { projectId }, createdTaskDto);
        }

        [HttpPut("gantt/{taskId}")]
        public async Task<IActionResult> UpdateGanttTask(int projectId, int taskId, [FromBody] CreateOrUpdateGanttTaskDto dto)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId && t.TaskType == "GANTT");
            if (task == null) return NotFound("Task not found.");

            var startDate = ParseDateAsUtc(dto.StartDate);
            var endDate = ParseDateAsUtc(dto.EndDate);
            if (!startDate.HasValue || !endDate.HasValue || endDate < startDate)
                return BadRequest("Invalid date format or range.");

            task.Title = dto.Title;
            task.StartDate = startDate.Value;
            task.DueDate = endDate.Value;
            task.Weight = dto.Weight;
            task.PlannedColor = dto.PlannedColor;
            task.ExecutedColor = dto.ExecutedColor;
            task.TotalUnits = dto.TotalUnits;
            task.CompletedUnits = Math.Max(0, Math.Min(dto.CompletedUnits, dto.TotalUnits));
            task.EstimatedHours = dto.EstimatedHours;
            task.AllocatedHours = dto.AllocatedHours;
            task.Progress = task.TotalUnits > 0 ? (int)Math.Round((double)task.CompletedUnits / task.TotalUnits * 100) : 0;

            await _context.SaveChangesAsync();
            await SyncProjectProgress(projectId);
            return NoContent();
        }

        [HttpDelete("gantt/{taskId}")]
        public async Task<IActionResult> DeleteGanttTask(int projectId, int taskId)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId && t.TaskType == "GANTT");
            if (task == null) return NotFound();
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            await SyncProjectProgress(projectId);
            return NoContent();
        }

        [HttpPost("gantt/add-from-templates")]
        public async Task<IActionResult> AddGanttTasksFromTemplates(int projectId, [FromBody] AddFromTemplatesDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
            if (!projectExists) return NotFound();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var templates = await _context.TaskTemplates
                    .Where(t => dto.SubsystemIds.Contains(t.SubsystemId))
                    .ToListAsync();
                if (!templates.Any()) return Ok(new List<GanttTaskDto>());

                DateTime defaultStartDate;
                var parsedUserDate = ParseDateAsUtc(dto.StartDate);
                if (parsedUserDate.HasValue)
                    defaultStartDate = parsedUserDate.Value;
                else
                {
                    var today = DateTime.UtcNow;
                    defaultStartDate = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                }

                var newTasks = new List<TaskModel>();
                foreach (var template in templates)
                {
                    var duration = template.DefaultDurationInDays > 0 ? template.DefaultDurationInDays : 1;
                    var defaultEndDate = defaultStartDate.AddDays(duration - 1);
                    newTasks.Add(new TaskModel
                    {
                        ProjectId = projectId,
                        Title = template.Title,
                        Weight = template.DefaultWeight,
                        TaskType = "GANTT",
                        Status = "ToDo",
                        StartDate = defaultStartDate,
                        DueDate = defaultEndDate,
                        TotalUnits = duration,
                        CompletedUnits = 0,
                        Progress = 0,
                        CreatedById = userId,
                        CreatedAt = DateTime.UtcNow,
                        TaskTemplateId = template.Id
                    });
                }
                await _context.Tasks.AddRangeAsync(newTasks);
                await _context.SaveChangesAsync();
                await SyncProjectProgress(projectId);

                var allProjectTasksResult = await GetGanttTasksForProject(projectId);
                await transaction.CommitAsync();
                if (allProjectTasksResult.Result is OkObjectResult okResult)
                    return Ok(okResult.Value);
                return StatusCode(500, "Error processing result.");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Internal Server Error.");
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasksForProject(int projectId)
        {
            var tasks = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.ChecklistStep)
                .Where(t => t.ProjectId == projectId && t.TaskType == "TASK")
                .Select(t => new TaskDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,
                    AssigneeId = t.AssigneeId,
                    AssigneeName = t.Assignee != null ? t.Assignee.FullName : "Unassigned",
                    DueDate = t.DueDate,
                    StartDate = t.StartDate,
                    ChecklistStepId = t.ChecklistStepId,
                    DisplayOrder = t.DisplayOrder,
                    StepName = t.ChecklistStep != null ? t.ChecklistStep.StepName : null,
                    EstimatedHours = t.EstimatedHours,
                    AllocatedHours = t.AllocatedHours
                })
                .ToListAsync();
            return Ok(tasks);
        }

        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask(int projectId, CreateTaskDto createTaskDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
            if (!projectExists) return NotFound("Project not found.");

            int displayOrder = 0;
            if (createTaskDto.ChecklistStepId.HasValue)
            {
                var maxOrder = await _context.Tasks
                    .Where(t => t.ProjectId == projectId && t.ChecklistStepId == createTaskDto.ChecklistStepId)
                    .MaxAsync(t => (int?)t.DisplayOrder) ?? 0;
                displayOrder = maxOrder + 1;
            }

            var task = new TaskModel
            {
                ProjectId = projectId,
                Title = createTaskDto.Title,
                Description = createTaskDto.Description,
                Priority = createTaskDto.Priority ?? "Medium",
                AssigneeId = createTaskDto.AssigneeId,
                DueDate = createTaskDto.DueDate,
                StartDate = createTaskDto.StartDate ?? DateTime.UtcNow,
                Status = "ToDo",
                TaskType = "TASK",
                CreatedAt = DateTime.UtcNow,
                CreatedById = userId,
                ChecklistStepId = createTaskDto.ChecklistStepId,
                DisplayOrder = displayOrder,
                EstimatedHours = createTaskDto.EstimatedHours,
                AllocatedHours = createTaskDto.AllocatedHours
            };
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            await SyncProjectProgress(projectId);

            var assigneeName = "Unassigned";
            if (task.AssigneeId.HasValue)
            {
                var assignee = await _context.Users.FindAsync(task.AssigneeId.Value);
                if (assignee != null) assigneeName = assignee.FullName;
            }

            string stepName = null;
            if (task.ChecklistStepId.HasValue)
            {
                var step = await _context.ProjectChecklists.FindAsync(task.ChecklistStepId.Value);
                stepName = step?.StepName;
            }

            var taskDto = new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Status = task.Status,
                Priority = task.Priority,
                Description = task.Description,
                AssigneeId = task.AssigneeId,
                AssigneeName = assigneeName,
                DueDate = task.DueDate,
                StartDate = task.StartDate,
                ChecklistStepId = task.ChecklistStepId,
                DisplayOrder = task.DisplayOrder,
                StepName = stepName,
                EstimatedHours = task.EstimatedHours,
                AllocatedHours = task.AllocatedHours
            };
            return CreatedAtAction(nameof(GetTasksForProject), new { projectId }, taskDto);
        }

        [HttpPut("{taskId}")]
        public async Task<IActionResult> UpdateTask(int projectId, int taskId, [FromBody] UpdateTaskDto updateDto)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId && t.TaskType == "TASK");
            if (task == null) return NotFound();

            if (!string.IsNullOrEmpty(updateDto.Title))
                task.Title = updateDto.Title;
            
            if (updateDto.Description != null)
                task.Description = updateDto.Description;
            
            if (!string.IsNullOrEmpty(updateDto.Priority))
                task.Priority = updateDto.Priority;
            
            if (updateDto.AssigneeId.HasValue)
                task.AssigneeId = updateDto.AssigneeId;
            
            if (updateDto.DueDate.HasValue)
                task.DueDate = updateDto.DueDate;
            
            if (updateDto.StartDate.HasValue)
                task.StartDate = updateDto.StartDate.Value;
            
            if (updateDto.EstimatedHours.HasValue)
                task.EstimatedHours = updateDto.EstimatedHours;
            
            if (updateDto.AllocatedHours.HasValue)
                task.AllocatedHours = updateDto.AllocatedHours;
            
            decimal estimated = task.EstimatedHours ?? 0;
            decimal allocated = task.AllocatedHours ?? 0;
            
            if (allocated == 0)
            {
                task.Status = "ToDo";
            }
            else if (allocated > estimated)
            {
                task.Status = "InProgress";
            }
            else if (allocated < estimated && allocated > 0)
            {
                task.Status = "InProgress";
            }
            else if (allocated == estimated && estimated > 0)
            {
                task.Status = "Done";
            }
            
            if (updateDto.ChecklistStepId.HasValue)
            {
                int newStepId = updateDto.ChecklistStepId.Value;
                if (newStepId == 0)
                {
                    task.ChecklistStepId = null;
                    task.DisplayOrder = 0;
                }
                else
                {
                    var stepExists = await _context.ProjectChecklists.AnyAsync(c => c.Id == newStepId && c.ProjectId == projectId);
                    if (stepExists)
                    {
                        task.ChecklistStepId = newStepId;
                        var maxOrder = await _context.Tasks
                            .Where(t => t.ProjectId == projectId && t.ChecklistStepId == newStepId && t.Id != taskId)
                            .MaxAsync(t => (int?)t.DisplayOrder) ?? 0;
                        task.DisplayOrder = maxOrder + 1;
                    }
                }
            }
            
            await _context.SaveChangesAsync();

            if (task.ChecklistStepId.HasValue)
            {
                await UpdateStepCompletionStatus(projectId, task.ChecklistStepId.Value);
                await SyncSingleStepToGantt(projectId, task.ChecklistStepId.Value);
            }

            await SyncProjectProgress(projectId);
            return NoContent();
        }

        [HttpPut("{taskId}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int projectId, int taskId, UpdateTaskStatusDto updateTaskStatusDto)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId);
            if (task == null) return NotFound();
            task.Status = updateTaskStatusDto.Status;
            await _context.SaveChangesAsync();

            if (task.ChecklistStepId.HasValue)
            {
                await UpdateStepCompletionStatus(projectId, task.ChecklistStepId.Value);
                await SyncSingleStepToGantt(projectId, task.ChecklistStepId.Value);
            }

            await SyncProjectProgress(projectId);
            return NoContent();
        }

        [HttpDelete("{taskId}")]
        public async Task<IActionResult> DeleteTask(int projectId, int taskId)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId && t.TaskType == "TASK");
            if (task == null) return NotFound("Task not found.");
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            await SyncProjectProgress(projectId);
            return NoContent();
        }

        [HttpGet("my-tasks")]
        public async Task<ActionResult<IEnumerable<MyTaskDto>>> GetMyTasks()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var tasks = await _context.Tasks
                .Where(t => t.AssigneeId == userId && t.TaskType == "TASK")
                .Select(t => new MyTaskDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    ProjectTitle = t.Project.Title
                })
                .ToListAsync();
            return Ok(tasks);
        }

        [HttpGet("all")]
        [Authorize(Roles = "SuperAdmin,ProjectManager")]
        public async Task<ActionResult<IEnumerable<MyTaskDto>>> GetAllTasks()
        {
            var tasks = await _context.Tasks
                .Where(t => t.TaskType == "TASK")
                .Select(t => new MyTaskDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    ProjectTitle = t.Project.Title
                })
                .ToListAsync();
            return Ok(tasks);
        }

        [HttpGet("grouped-by-checklist")]
        public async Task<IActionResult> GetTasksGroupedByChecklist(int projectId)
        {
            var checklists = await _context.ProjectChecklists
                .Where(c => c.ProjectId == projectId)
                .OrderBy(c => c.Id)
                .Select(c => new
                {
                    c.Id,
                    c.StepName,
                    c.IsCompleted,
                    Tasks = _context.Tasks
                        .Where(t => t.ProjectId == projectId && t.TaskType == "TASK" && t.ChecklistStepId == c.Id)
                        .OrderBy(t => t.DisplayOrder)
                        .Select(t => new
                        {
                            t.Id,
                            t.Title,
                            t.Status,
                            t.Priority,
                            AssigneeId = t.AssigneeId,
                            AssigneeName = t.Assignee != null ? t.Assignee.FullName : "Unassigned",
                            DueDate = t.DueDate,
                            StartDate = t.StartDate,
                            DisplayOrder = t.DisplayOrder,
                            EstimatedHours = t.EstimatedHours,
                            AllocatedHours = t.AllocatedHours
                        }).ToList()
                })
                .ToListAsync();

            return Ok(checklists);
        }

        [HttpPut("{taskId}/reorder")]
        public async Task<IActionResult> ReorderTask(int taskId, [FromBody] ReorderTaskDto dto)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null) return NotFound();

            var projectId = task.ProjectId;
            var stepId = task.ChecklistStepId;
            if (!stepId.HasValue) return BadRequest("Task is not linked to any step.");

            var tasksInStep = await _context.Tasks
                .Where(t => t.ProjectId == projectId && t.ChecklistStepId == stepId && t.TaskType == "TASK")
                .OrderBy(t => t.DisplayOrder)
                .ToListAsync();

            var currentIndex = tasksInStep.FindIndex(t => t.Id == taskId);
            if (currentIndex == -1) return NotFound();

            int newIndex;
            if (dto.Direction == "up")
                newIndex = currentIndex - 1;
            else if (dto.Direction == "down")
                newIndex = currentIndex + 1;
            else
                return BadRequest("Direction must be 'up' or 'down'");

            if (newIndex < 0 || newIndex >= tasksInStep.Count)
                return BadRequest("Cannot move further in this direction.");

            var otherTask = tasksInStep[newIndex];
            int tempOrder = task.DisplayOrder;
            task.DisplayOrder = otherTask.DisplayOrder;
            otherTask.DisplayOrder = tempOrder;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("rebuild-step-tasks")]
        public async Task<IActionResult> RebuildStepTasks(int projectId, [FromBody] RebuildStepTasksDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var step = await _context.ProjectChecklists
                .FirstOrDefaultAsync(c => c.Id == dto.ChecklistStepId && c.ProjectId == projectId);
            if (step == null) return NotFound("Step not found.");

            var project = await _context.Projects.FindAsync(projectId);
            int? defaultAssigneeId = project?.ProjectAssigneeId;

            var existingTasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId && t.ChecklistStepId == dto.ChecklistStepId && t.TaskType == "TASK")
                .ToListAsync();
            _context.Tasks.RemoveRange(existingTasks);

            var newTasks = new List<TaskModel>();
            for (int i = 1; i <= dto.SessionCount; i++)
            {
                newTasks.Add(new TaskModel
                {
                    ProjectId = projectId,
                    Title = $"{step.StepName} - Session {i}",
                    TaskType = "TASK",
                    Status = "ToDo",
                    Priority = "Medium",
                    ChecklistStepId = step.Id,
                    DisplayOrder = i,
                    CreatedAt = DateTime.UtcNow,
                    CreatedById = userId,
                    StartDate = DateTime.UtcNow,
                    EstimatedHours = 0,
                    AllocatedHours = 0,
                    AssigneeId = defaultAssigneeId
                });
            }
            await _context.Tasks.AddRangeAsync(newTasks);
            await _context.SaveChangesAsync();

            await SyncProjectProgress(projectId);

            return Ok(new { Count = newTasks.Count, Message = "Tasks rebuilt successfully." });
        }

        [HttpPost("sync-from-steps")]
        public async Task<IActionResult> SyncTasksFromSteps([FromBody] SyncStepTasksToGanttDto dto)
        {
            if (dto.ProjectId <= 0 || dto.Tasks == null || !dto.Tasks.Any())
                return BadRequest("Invalid input payload.");

            var project = await _context.Projects.FindAsync(dto.ProjectId);
            if (project == null) return NotFound("Project not found.");

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("ProjectManager");
            if (!isAdmin && project.ProjectManagerId != userId)
                return Forbid();

            var groupedByStep = dto.Tasks
                .Where(t => t.StepId.HasValue)
                .GroupBy(t => t.StepId.Value)
                .ToList();

            var results = new List<object>();

            foreach (var group in groupedByStep)
            {
                int stepId = group.Key;
                var stepTasks = group.ToList();
                string stepName = stepTasks.First().Title?.Split('-')[0].Trim() ?? "Untitled";
                var sessionDates = stepTasks.Select(t => t.SessionDate).OrderBy(d => d).ToList();
                DateTime startDate = sessionDates.First();
                DateTime endDate = sessionDates.Last();
                int totalSessions = stepTasks.Count;
                int completedSessions = stepTasks.Count(t => t.IsCompleted);
                int? assigneeId = stepTasks.FirstOrDefault(t => t.AssigneeId.HasValue)?.AssigneeId
                                   ?? project.ProjectAssigneeId;

                var existingGanttTask = await _context.Tasks
                    .FirstOrDefaultAsync(t => t.TaskType == "GANTT" && t.Title == stepName && t.ProjectId == dto.ProjectId
                                              && (t.TaskTemplateId == null || t.TaskTemplateId == 0));

                int progress = totalSessions > 0 ? (int)Math.Round((double)completedSessions / totalSessions * 100) : 0;

                if (existingGanttTask != null)
                {
                    existingGanttTask.Title = stepName;
                    existingGanttTask.StartDate = startDate;
                    existingGanttTask.DueDate = endDate;
                    existingGanttTask.AssigneeId = assigneeId;
                    existingGanttTask.EstimatedHours = totalSessions * 4;
                    existingGanttTask.AllocatedHours = completedSessions * 4;
                    existingGanttTask.TotalUnits = totalSessions;
                    existingGanttTask.CompletedUnits = completedSessions;
                    existingGanttTask.Progress = progress;
                    _context.Tasks.Update(existingGanttTask);
                    results.Add(new { Action = "Updated", Id = existingGanttTask.Id, Title = stepName, StepId = stepId });
                }
                else
                {
                    var newGanttTask = new TaskModel
                    {
                        ProjectId = dto.ProjectId,
                        Title = stepName,
                        TaskType = "GANTT",
                        Status = "ToDo",
                        StartDate = startDate,
                        DueDate = endDate,
                        AssigneeId = assigneeId,
                        EstimatedHours = totalSessions * 4,
                        AllocatedHours = completedSessions * 4,
                        TotalUnits = totalSessions,
                        CompletedUnits = completedSessions,
                        Progress = progress,
                        CreatedAt = DateTime.UtcNow,
                        CreatedById = userId,
                        PlannedColor = "#3b82f6",
                        ExecutedColor = "#10b981"
                    };
                    _context.Tasks.Add(newGanttTask);
                    results.Add(new { Action = "Created", Id = newGanttTask.Id, Title = stepName, StepId = stepId });
                }
            }

            await _context.SaveChangesAsync();
            await SyncProjectProgress(dto.ProjectId);

            return Ok(new { Message = $"Sync completed. {results.Count} steps processed.", Results = results });
        }

        [HttpPost("sync-step-to-gantt/{stepId}")]
        public async Task<IActionResult> SyncSingleStepToGantt(int projectId, int stepId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found.");

            var step = await _context.ProjectChecklists.FindAsync(stepId);
            if (step == null) return NotFound("Step not found.");

            var stepTasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId && t.ChecklistStepId == stepId && t.TaskType == "TASK")
                .ToListAsync();

            if (!stepTasks.Any()) return Ok(new { Message = "No tasks found for this step." });

            var taskItems = stepTasks.Select(t => new StepTaskSyncItem
            {
                StepTaskId = t.Id,
                Title = t.Title,
                SessionDate = t.StartDate,
                AssigneeId = t.AssigneeId,
                IsCompleted = t.Status == "Done",
                StepId = stepId
            }).ToList();

            var grouped = taskItems.GroupBy(x => x.StepId.Value).ToList();
            var results = new List<object>();

            foreach (var group in grouped)
            {
                int sid = group.Key;
                var items = group.ToList();
                string stepName = items.First().Title?.Split('-')[0].Trim() ?? "Untitled";
                var sessionDates = items.Select(t => t.SessionDate).OrderBy(d => d).ToList();
                DateTime startDate = sessionDates.First();
                DateTime endDate = sessionDates.Last();
                int totalSessions = items.Count;
                int completedSessions = items.Count(t => t.IsCompleted);
                int? assigneeId = items.FirstOrDefault(t => t.AssigneeId.HasValue)?.AssigneeId ?? project.ProjectAssigneeId;

                var existingGanttTask = await _context.Tasks
                    .FirstOrDefaultAsync(t => t.TaskType == "GANTT" && t.Title == stepName && t.ProjectId == projectId
                                              && (t.TaskTemplateId == null || t.TaskTemplateId == 0));

                int progress = totalSessions > 0 ? (int)Math.Round((double)completedSessions / totalSessions * 100) : 0;

                if (existingGanttTask != null)
                {
                    existingGanttTask.StartDate = startDate;
                    existingGanttTask.DueDate = endDate;
                    existingGanttTask.AssigneeId = assigneeId;
                    existingGanttTask.EstimatedHours = totalSessions * 4;
                    existingGanttTask.AllocatedHours = completedSessions * 4;
                    existingGanttTask.TotalUnits = totalSessions;
                    existingGanttTask.CompletedUnits = completedSessions;
                    existingGanttTask.Progress = progress;
                    _context.Tasks.Update(existingGanttTask);
                    results.Add(new { Action = "Updated", Id = existingGanttTask.Id, Title = stepName });
                }
                else
                {
                    var newGanttTask = new TaskModel
                    {
                        ProjectId = projectId,
                        Title = stepName,
                        TaskType = "GANTT",
                        Status = "ToDo",
                        StartDate = startDate,
                        DueDate = endDate,
                        AssigneeId = assigneeId,
                        EstimatedHours = totalSessions * 4,
                        AllocatedHours = completedSessions * 4,
                        TotalUnits = totalSessions,
                        CompletedUnits = completedSessions,
                        Progress = progress,
                        CreatedAt = DateTime.UtcNow,
                        CreatedById = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)),
                        PlannedColor = "#3b82f6",
                        ExecutedColor = "#10b981"
                    };
                    _context.Tasks.Add(newGanttTask);
                    results.Add(new { Action = "Created", Id = newGanttTask.Id, Title = stepName });
                }
            }

            await _context.SaveChangesAsync();
            await SyncProjectProgress(projectId);

            return Ok(new { Message = $"Step {step.StepName} synced to Gantt Chart.", Results = results });
        }
    }
}