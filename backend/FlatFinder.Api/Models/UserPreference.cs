namespace FlatFinder.Api.Models;

public class UserPreference
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? PreferredRooms { get; set; }
    /// <summary>Comma-separated preferred areas in Kathmandu.</summary>
    public string? PreferredAreas { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
