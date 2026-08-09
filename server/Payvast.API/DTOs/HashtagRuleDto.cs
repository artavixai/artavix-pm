namespace Payvast.API.DTOs
{
    public class HashtagRuleDto
    {
        public int Id { get; set; }
        public string Hashtag { get; set; }
        public string TargetType { get; set; }
        public string TargetValue { get; set; }
    }

    public class CreateHashtagRuleDto
    {
        public string Hashtag { get; set; }
        public string TargetType { get; set; }
        public string TargetValue { get; set; }
    }
}