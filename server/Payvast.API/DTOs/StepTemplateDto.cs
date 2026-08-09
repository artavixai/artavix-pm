namespace Payvast.API.DTOs
{
    public class StepTemplateDto
    {
        public int Id { get; set; }
        public int ProductGroupId { get; set; }
        public string ProductGroupName { get; set; }
        public string StepName { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}