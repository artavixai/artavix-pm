namespace Payvast.API.Models
{
    public class Subsystem
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public int ProductGroupId { get; set; } // کلید خارجی برای اتصال به گروه محصول
        public ProductGroup ProductGroup { get; set; } // Navigation Property

        public ICollection<TaskTemplate> TaskTemplates { get; set; } = new List<TaskTemplate>();
    }
}