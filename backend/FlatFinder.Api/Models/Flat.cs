namespace FlatFinder.Api.Models;

/// <summary>
/// Rental listing in Kathmandu Valley.
/// </summary>
public class Flat
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    /// <summary>Neighborhood or ward (e.g. Thamel, Patan).</summary>
    public string LocationArea { get; set; } = string.Empty;
    public string City { get; set; } = "Kathmandu";
    public decimal PriceMonthly { get; set; }
    public int Rooms { get; set; }
    public int? AreaSqM { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset ListedAt { get; set; } = DateTimeOffset.UtcNow;

    public ApplicationUser? User { get; set; }
}
