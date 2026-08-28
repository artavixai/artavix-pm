using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Payvast.API.Data;
using Payvast.API.DTOs;
using Payvast.API.Models;
using Task = System.Threading.Tasks.Task;

namespace Payvast.API.Services
{
    public class GroqAiService
    {
        private readonly HttpClient _httpClient;
        private readonly ApplicationDbContext _context;

        private const string DefaultModel = "openai/gpt-oss-120b";
        private const string GroqApiUrl = "https://api.groq.com/openai/v1/chat/completions";

        public GroqAiService(HttpClient httpClient, ApplicationDbContext context)
        {
            _httpClient = httpClient;
            _context = context;
        }

        public async System.Threading.Tasks.Task<GroqSettingsDto> GetSettingsAsync()
        {
            var apiKeySetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.FeatureName == "GroqApiKey");
            var modelSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.FeatureName == "GroqModel");
            var tempSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.FeatureName == "GroqTemperature");
            var maxTokensSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.FeatureName == "GroqMaxTokens");
            var enabledSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.FeatureName == "GroqAiEnabled");

            return new GroqSettingsDto
            {
                ApiKey = apiKeySetting?.Description ?? "",
                Model = !string.IsNullOrEmpty(modelSetting?.Description) ? modelSetting.Description : DefaultModel,
                Temperature = double.TryParse(tempSetting?.Description, out var t) ? t : 0.3,
                MaxTokens = int.TryParse(maxTokensSetting?.Description, out var m) ? m : 4096,
                IsEnabled = enabledSetting?.IsEnabled ?? false
            };
        }

        public async Task SaveSettingsAsync(UpdateGroqSettingsDto dto)
        {
            await UpsertSettingAsync("GroqApiKey", dto.ApiKey ?? "", true);
            await UpsertSettingAsync("GroqModel", dto.Model ?? DefaultModel, true);
            await UpsertSettingAsync("GroqTemperature", dto.Temperature.ToString(), true);
            await UpsertSettingAsync("GroqMaxTokens", dto.MaxTokens.ToString(), true);
            await UpsertSettingAsync("GroqAiEnabled", "AI Feature Toggle", dto.IsEnabled);
            await _context.SaveChangesAsync();
        }

        private async Task UpsertSettingAsync(string name, string desc, bool isEnabled)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.FeatureName == name);
            if (setting == null)
            {
                _context.SystemSettings.Add(new SystemSetting
                {
                    FeatureName = name,
                    Description = desc,
                    IsEnabled = isEnabled
                });
            }
            else
            {
                setting.Description = desc;
                setting.IsEnabled = isEnabled;
            }
        }

        public async System.Threading.Tasks.Task<string> TestConnectionAsync(string apiKey, string model)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new Exception("Groq API Key has not been provided.");

            var selectedModel = !string.IsNullOrWhiteSpace(model) ? model : DefaultModel;

            var requestBody = new
            {
                model = selectedModel,
                messages = new[]
                {
                    new { role = "user", content = "Ping test. Respond with OK." }
                },
                max_tokens = 10
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, GroqApiUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Groq API Error: {response.StatusCode} - {responseJson}");
            }

            return "Connection to Groq API successfully established.";
        }

        public async System.Threading.Tasks.Task<string> GenerateChatCompletionAsync(string systemPrompt, string userPrompt)
        {
            var settings = await GetSettingsAsync();
            if (string.IsNullOrWhiteSpace(settings.ApiKey))
                throw new Exception("Groq API Key is not configured. Please enter the API key in System Settings.");

            var requestBody = new
            {
                model = settings.Model,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                temperature = settings.Temperature,
                max_completion_tokens = settings.MaxTokens
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, GroqApiUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey.Trim());
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Groq API Error: {response.StatusCode} - {responseJson}");
            }

            using var doc = JsonDocument.Parse(responseJson);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return content;
        }
    }
}