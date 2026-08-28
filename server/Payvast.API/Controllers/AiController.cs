using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Services;
using TaskModel = Payvast.API.Models.Task;

namespace Payvast.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly GroqAiService _aiService;
        private readonly ApplicationDbContext _context;

        public AiController(GroqAiService aiService, ApplicationDbContext context)
        {
            _aiService = aiService;
            _context = context;
        }

        [HttpGet("settings")]
        [Authorize(Roles = "SuperAdmin,ProjectManager")]
        public async System.Threading.Tasks.Task<ActionResult<GroqSettingsDto>> GetSettings()
        {
            var settings = await _aiService.GetSettingsAsync();
            if (!string.IsNullOrEmpty(settings.ApiKey) && settings.ApiKey.Length > 8)
            {
                settings.ApiKey = settings.ApiKey.Substring(0, 4) + "..." + settings.ApiKey.Substring(settings.ApiKey.Length - 4);
            }
            return Ok(settings);
        }

        [HttpPut("settings")]
        [Authorize(Roles = "SuperAdmin")]
        public async System.Threading.Tasks.Task<IActionResult> UpdateSettings([FromBody] UpdateGroqSettingsDto dto)
        {
            await _aiService.SaveSettingsAsync(dto);
            return Ok(new { message = "AI settings saved successfully." });
        }

        [HttpPost("test-connection")]
        [Authorize(Roles = "SuperAdmin,ProjectManager")]
        public async System.Threading.Tasks.Task<IActionResult> TestConnection([FromBody] UpdateGroqSettingsDto dto)
        {
            try
            {
                var result = await _aiService.TestConnectionAsync(dto.ApiKey, dto.Model);
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("analyze-project/{projectId}")]
        public async System.Threading.Tasks.Task<ActionResult<AiProjectAnalysisResponseDto>> AnalyzeProject(int projectId)
        {
            var project = await _context.Projects
                .Include(p => p.SubProjects)
                    .ThenInclude(sp => sp.Tasks)
                .Include(p => p.Tasks)
                .Include(p => p.Checklists)
                .Include(p => p.ProjectManager)
                .Include(p => p.ProjectAssignee)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { error = "Project not found." });

            var followUps = await _context.ProjectFollowUps
                .Where(f => f.ProjectId == projectId)
                .OrderByDescending(f => f.FollowUpDate)
                .Take(10)
                .AsNoTracking()
                .ToListAsync();

            var crmActions = await _context.CrmActions
                .Where(a => a.ProjectId == projectId)
                .OrderByDescending(a => a.ActionDate)
                .Take(10)
                .AsNoTracking()
                .ToListAsync();

            var allTasks = new List<TaskModel>();
            if (project.Tasks != null) allTasks.AddRange(project.Tasks);
            if (project.SubProjects != null)
            {
                foreach (var sp in project.SubProjects)
                {
                    if (sp.Tasks != null) allTasks.AddRange(sp.Tasks);
                }
            }

            var totalEstimatedHours = allTasks.Sum(t => t.EstimatedHours ?? 0);
            var totalAllocatedHours = allTasks.Sum(t => t.AllocatedHours ?? 0);
            var completedTasks = allTasks.Count(t => t.Status == "Done");
            var inProgressTasks = allTasks.Count(t => t.Status == "InProgress" || t.Status == "In Progress");

            var projectSummary = new
            {
                Title = project.Title,
                CrmCode = project.CrmCode,
                Buyer = project.BuyerName,
                Manager = project.ProjectManager?.FullName,
                Assignee = project.ProjectAssignee?.FullName,
                Status = project.Status,
                CustomStatus = project.CustomStatus,
                BlockedReason = project.BlockedReason,
                CurrentProgress = project.Progress,
                StartDate = project.StartDate?.ToString("yyyy/MM/dd"),
                EndDate = project.EndDate?.ToString("yyyy/MM/dd"),
                TotalEstimatedHours = totalEstimatedHours,
                TotalAllocatedHours = totalAllocatedHours,
                TotalTasksCount = allTasks.Count,
                CompletedTasksCount = completedTasks,
                InProgressTasksCount = inProgressTasks,
                SubProjects = project.SubProjects.Select(sp => new
                {
                    sp.Title,
                    sp.Progress,
                    sp.Status,
                    TasksCount = sp.Tasks != null ? sp.Tasks.Count : 0
                }).ToList(),
                ChecklistSteps = project.Checklists.Select(c => new
                {
                    c.StepName,
                    c.IsCompleted
                }).ToList(),
                RecentFollowUps = followUps.Select(f => new
                {
                    f.Content,
                    f.FollowUpDate,
                    f.IsResolved
                }).ToList(),
                RecentCrmActions = crmActions.Select(a => new
                {
                    a.ActivityType,
                    a.Duration,
                    a.Description
                }).ToList()
            };

            string systemPrompt = @"You are a Senior Enterprise Project Management AI Consultant (Artavix AI PM).
Your task is to thoroughly analyze the provided project metrics and return a structured JSON response in fluent English.
The JSON MUST follow this exact schema:
{
  ""healthScore"": <Integer between 0 and 100 representing project health>,
  ""statusSummary"": ""<A concise 2-sentence executive summary in English>"",
  ""detailedAnalysis"": ""<Comprehensive multi-paragraph analysis in Markdown format covering progress velocity, schedule variance, capacity utilization, and key delivery risks in English>"",
  ""criticalBottlenecks"": [""<Bottleneck 1 in English>"", ""<Bottleneck 2 in English>"", ...],
  ""recommendedActions"": [""<Action 1 in English>"", ""<Action 2 in English>"", ...],
  ""predictedDeliveryRisk"": ""<Low | Medium | High | Critical>""
}
Ensure all textual fields are written in professional English only. Only output the raw JSON object.";

            string userPrompt = $"Analyze this project and generate the executive strategic report in English:\n\n{JsonSerializer.Serialize(projectSummary, new JsonSerializerOptions { WriteIndented = true })}";

            try
            {
                var aiResponseRaw = await _aiService.GenerateChatCompletionAsync(systemPrompt, userPrompt);
                
                string cleanedJson = aiResponseRaw.Trim();
                if (cleanedJson.StartsWith("```json"))
                {
                    cleanedJson = cleanedJson.Substring(7);
                }
                if (cleanedJson.StartsWith("```"))
                {
                    cleanedJson = cleanedJson.Substring(3);
                }
                if (cleanedJson.EndsWith("```"))
                {
                    cleanedJson = cleanedJson.Substring(0, cleanedJson.Length - 3);
                }
                cleanedJson = cleanedJson.Trim();

                using var doc = JsonDocument.Parse(cleanedJson);
                var root = doc.RootElement;

                var result = new AiProjectAnalysisResponseDto
                {
                    ProjectId = project.Id,
                    ProjectTitle = project.Title,
                    HealthScore = root.TryGetProperty("healthScore", out var hs) ? hs.GetInt32() : (100 - Math.Max(0, 100 - project.Progress)),
                    StatusSummary = root.TryGetProperty("statusSummary", out var ss) ? ss.GetString() : "Executive project summary generated successfully.",
                    DetailedAnalysis = root.TryGetProperty("detailedAnalysis", out var da) ? da.GetString() : cleanedJson,
                    PredictedDeliveryRisk = root.TryGetProperty("predictedDeliveryRisk", out var pdr) ? pdr.GetString() : "Medium",
                    AnalyzedAt = DateTime.UtcNow
                };

                if (root.TryGetProperty("criticalBottlenecks", out var cb) && cb.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in cb.EnumerateArray())
                    {
                        result.CriticalBottlenecks.Add(item.GetString());
                    }
                }

                if (root.TryGetProperty("recommendedActions", out var ra) && ra.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in ra.EnumerateArray())
                    {
                        result.RecommendedActions.Add(item.GetString());
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"AI Analysis Error: {ex.Message}" });
            }
        }
    }
}