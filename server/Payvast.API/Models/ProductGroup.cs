namespace Payvast.API.Models
{
    public class ProductGroup
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; } // برای ذخیره کد رنگ هگزادسیمال
        public ICollection<Subsystem> Subsystems { get; set; } = new List<Subsystem>();
    }
}