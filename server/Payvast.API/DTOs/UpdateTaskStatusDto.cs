using System.ComponentModel.DataAnnotations;

namespace Payvast.API.DTOs
{
    public class UpdateTaskStatusDto
    {
        [Required]
        public string Status { get; set; }
    }
}