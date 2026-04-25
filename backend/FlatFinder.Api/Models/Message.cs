namespace FlatFinder.Api.Models;

public class Message
{
    public int Id { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string ReceiverId { get; set; } = string.Empty;
    public int FlatId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderPhone { get; set; } = string.Empty;
    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsRead { get; set; }

    public ApplicationUser? Sender { get; set; }
    public ApplicationUser? Receiver { get; set; }
    public Flat? Flat { get; set; }
}
