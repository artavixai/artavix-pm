using System.Collections.Generic;

namespace Payvast.API.DTOs
{
    public class GroqSettingsDto
    {
        public string ApiKey { get; set; }
        public bool HasApiKey { get; set; }
        public string Model { get; set; } = "openai/gpt-oss-120b";
        public double Temperature { get; set; } = 0.3;
        public int MaxTokens { get; set; } = 4096;
        public bool IsEnabled { get; set; } = true;
    }

    public class UpdateGroqSettingsDto
    {
        public string ApiKey { get; set; }
        public string Model { get; set; } = "openai/gpt-oss-120b";
        public double Temperature { get; set; } = 0.3;
        public int MaxTokens { get; set; } = 4096;
        public bool IsEnabled { get; set; } = true;
    }

    public class AiProjectAnalysisResponseDto
    {
        public int ProjectId { get; set; }
        public string ProjectTitle { get; set; }
        public int HealthScore { get; set; }
        public string StatusSummary { get; set; }
        public string DetailedAnalysis { get; set; }
        public List<string> CriticalBottlenecks { get; set; } = new List<string>();
        public List<string> RecommendedActions { get; set; } = new List<string>();
        public string PredictedDeliveryRisk { get; set; }
        public System.DateTime AnalyzedAt { get; set; } = System.DateTime.UtcNow;
    }
}