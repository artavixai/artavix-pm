using System;

namespace Payvast.API.DTOs
{
    public class ProjectChecklistDto
    {
        public int Id { get; set; }
        public string StepName { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int? CompletedByUserId { get; set; }
        public string CompletedByName { get; set; }
    }
}