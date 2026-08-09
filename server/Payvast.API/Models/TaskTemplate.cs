using System.Collections.Generic;

namespace Payvast.API.Models
{
    public class TaskTemplate
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int? DefaultWeight { get; set; }
        public int DefaultDurationInDays { get; set; }
        public int SubsystemId { get; set; }
        public Subsystem Subsystem { get; set; }
        public ICollection<Payvast.API.Models.Task> GeneratedTasks { get; set; } = new List<Payvast.API.Models.Task>();
    }
}