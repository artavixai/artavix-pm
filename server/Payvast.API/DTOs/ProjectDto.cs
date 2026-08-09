namespace Payvast.API.DTOs
{
    // این DTO برای نمایش یک پروژه تنها در ساختار درختی است
    public class ProjectNodeDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string CrmCode { get; set; }
        public string Status { get; set; }
        public int Progress { get; set; }
        public List<ProjectNodeDto> SubProjects { get; set; } = new List<ProjectNodeDto>();
    }
}