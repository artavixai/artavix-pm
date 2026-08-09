using System;

namespace Payvast.API.DTOs
{
    public class MoveGanttTaskDto
    {
        public int TaskId { get; set; }
        public DateTime NewDate { get; set; }
    }

    public class PlanDisplayDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserFullName { get; set; }
        public string UserAvatarUrl { get; set; }
        public string Title { get; set; }
        public string ProjectTitle { get; set; }
        public string Description { get; set; }
        public DateTime PlanDate { get; set; }
        public double StartHour { get; set; }
        public double EndHour { get; set; }
        public bool IsCompleted { get; set; }
        public string Color { get; set; }
        public bool IsTask { get; set; }
    }
}