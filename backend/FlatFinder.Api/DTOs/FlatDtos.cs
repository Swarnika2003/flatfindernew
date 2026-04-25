using System.ComponentModel.DataAnnotations;

namespace FlatFinder.Api.DTOs;

public class FlatSearchRequest
{
    [MaxLength(120)]
    public string? Location { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal? MinPrice { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal? MaxPrice { get; set; }

    [Range(0, 20)]
    public int? Rooms { get; set; }

    [Range(1, 50)]
    public int Page { get; set; } = 1;

    [Range(1, 50)]
    public int PageSize { get; set; } = 12;
}

public class FlatDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LocationArea { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public int Rooms { get; set; }
    public int? AreaSqM { get; set; }
    public DateTimeOffset ListedAt { get; set; }
}

public class FlatDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LocationArea { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public int Rooms { get; set; }
    public int? AreaSqM { get; set; }
    public DateTimeOffset ListedAt { get; set; }
    public string? OwnerName { get; set; }
    public string? OwnerEmail { get; set; }
}

public class CreateFlatDto
{
    [Length(3, 200)]
    public string Title { get; set; } = string.Empty;

    [Length(10, 1000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(120)]
    public string LocationArea { get; set; } = string.Empty;

    [MaxLength(50)]
    public string City { get; set; } = "Kathmandu";

    [Range(0, 1_000_000_000)]
    public decimal PriceMonthly { get; set; }

    [Range(1, 20)]
    public int Rooms { get; set; }

    [Range(1, 1000)]
    public int? AreaSqM { get; set; }
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class PreferenceRequest
{
    [Range(0, 1_000_000_000)]
    public decimal? MinPrice { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal? MaxPrice { get; set; }

    [Range(0, 20)]
    public int? PreferredRooms { get; set; }

    [MaxLength(500)]
    public string? PreferredAreas { get; set; }
}

public class PreferenceDto
{
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? PreferredRooms { get; set; }
    public string? PreferredAreas { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
