namespace Payvast.API.Models
{
    public class SystemSetting
    {
        public int Id { get; set; }
        public string FeatureName { get; set; }
        public bool IsEnabled { get; set; }
        public string Description { get; set; }
    }
}