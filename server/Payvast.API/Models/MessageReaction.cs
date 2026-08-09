using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Payvast.API.Models
{
    [Table("MessageReactions")]
    public class MessageReaction
    {
        [Key]
        public int Id { get; set; }
        
        // نکته مهم: چون Id در ChatMessage از نوع long است، اینجا هم باید long باشد
        public long MessageId { get; set; }
        
        public int UserId { get; set; }
        
        public string Reaction { get; set; }

        [ForeignKey("MessageId")]
        public virtual ChatMessage Message { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
