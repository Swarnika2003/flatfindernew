namespace FlatFinder.Api.Models;

public class SearchHistory
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public string? LocationKeyword { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? Rooms { get; set; }
    public int ResultCount { get; set; }
    public DateTimeOffset SearchedAt { get; set; } = DateTimeOffset.UtcNow;
}
