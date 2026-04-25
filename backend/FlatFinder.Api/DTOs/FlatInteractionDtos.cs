using System.ComponentModel.DataAnnotations;

namespace FlatFinder.Api.DTOs;

public class FavoriteDto
{
    public int FlatId { get; set; }
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string LocationArea { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public int Rooms { get; set; }
    public int? AreaSqM { get; set; }
    public DateTimeOffset FavoritedAt { get; set; }
}

public class MessageDto
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderPhone { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public int FlatId { get; set; }
    public string FlatTitle { get; set; } = string.Empty;
    public DateTimeOffset SentAt { get; set; }
    public bool IsRead { get; set; }
}

public class CreateMessageDto
{
    [MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Length(10, 1000)]
    public string Body { get; set; } = string.Empty;

    [EmailAddress]
    public string SenderEmail { get; set; } = string.Empty;

    [Phone]
    public string SenderPhone { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int FlatId { get; set; }
}
