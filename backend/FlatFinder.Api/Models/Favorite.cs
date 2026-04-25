namespace FlatFinder.Api.Models;

public class Favorite
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int FlatId { get; set; }
    public DateTimeOffset FavoritedAt { get; set; } = DateTimeOffset.UtcNow;

    public ApplicationUser? User { get; set; }
    public Flat? Flat { get; set; }
}
