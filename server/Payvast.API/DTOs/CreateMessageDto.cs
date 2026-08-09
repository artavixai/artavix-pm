// =======================================
// CreateMessageDto.cs  (NEW REQUIRED)
// =======================================

using Payvast.API.DTOs;

public class CreateMessageDto
{
    public int ChannelId { get; set; }
    public MessageType Type { get; set; }

    public string Content { get; set; }
    public string Caption { get; set; }
    public string AttachmentUrl { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public long? ReplyToId { get; set; }
}
