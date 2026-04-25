using FlatFinder.Api.Data;
using FlatFinder.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FlatFinder.Api.Services;

/// <summary>
/// Scores flats from saved preferences and recent search patterns (Kathmandu listings).
/// </summary>
public class RecommendationService : IRecommendationService
{
    private readonly AppDbContext _db;
    private const int MaxCandidates = 400;

    public RecommendationService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Flat>> GetRecommendationsAsync(string userId, int take, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 50);

        var pref = await _db.UserPreferences.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        var recentSearches = await _db.SearchHistories.AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.SearchedAt)
            .Take(25)
            .ToListAsync(ct);

        var candidates = await _db.Flats.AsNoTracking()
            .Where(f => f.IsActive && f.City == "Kathmandu")
            .OrderByDescending(f => f.ListedAt)
            .Take(MaxCandidates)
            .ToListAsync(ct);

        if (candidates.Count == 0)
            return Array.Empty<Flat>();

        var preferredAreaSet = ParseAreas(pref?.PreferredAreas);
        var mins = recentSearches.Where(s => s.MinPrice.HasValue).Select(s => s.MinPrice!.Value).ToList();
        var maxs = recentSearches.Where(s => s.MaxPrice.HasValue).Select(s => s.MaxPrice!.Value).ToList();
        var avgMin = mins.Count > 0 ? mins.Average() : 0m;
        var avgMax = maxs.Count > 0 ? maxs.Average() : 0m;
        var hasPriceBand = recentSearches.Any(s => s.MinPrice.HasValue || s.MaxPrice.HasValue);
        var modeRooms = recentSearches.Where(s => s.Rooms.HasValue)
            .GroupBy(s => s.Rooms!.Value)
            .OrderByDescending(g => g.Count())
            .Select(g => (int?)g.Key)
            .FirstOrDefault();

        var scored = candidates
            .Select(f => new { Flat = f, Score = ScoreFlat(f, pref, preferredAreaSet, recentSearches, avgMin, avgMax, hasPriceBand, modeRooms) })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Flat.ListedAt)
            .Take(take)
            .Select(x => x.Flat)
            .ToList();

        return scored;
    }

    private static HashSet<string> ParseAreas(string? csv)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(csv)) return set;
        foreach (var part in csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            set.Add(part);
        return set;
    }

    private static double ScoreFlat(
        Flat f,
        UserPreference? pref,
        HashSet<string> preferredAreas,
        List<SearchHistory> searches,
        decimal avgMin,
        decimal avgMax,
        bool hasPriceBand,
        int? modeRooms)
    {
        double score = 0;

        if (pref != null)
        {
            if (pref.MinPrice.HasValue && f.PriceMonthly >= pref.MinPrice) score += 2;
            if (pref.MaxPrice.HasValue && f.PriceMonthly <= pref.MaxPrice) score += 2;
            if (pref.PreferredRooms.HasValue && f.Rooms == pref.PreferredRooms) score += 3;
            if (preferredAreas.Count > 0 && preferredAreas.Contains(f.LocationArea)) score += 4;
        }

        foreach (var s in searches)
        {
            if (!string.IsNullOrWhiteSpace(s.LocationKeyword) &&
                f.LocationArea.Contains(s.LocationKeyword, StringComparison.OrdinalIgnoreCase))
                score += 1.5;

            if (s.Rooms.HasValue && f.Rooms == s.Rooms.Value) score += 0.8;

            if (s.MinPrice.HasValue && s.MaxPrice.HasValue &&
                f.PriceMonthly >= s.MinPrice && f.PriceMonthly <= s.MaxPrice)
                score += 1.2;
        }

        if (hasPriceBand && avgMax > 0 && f.PriceMonthly >= avgMin && f.PriceMonthly <= avgMax)
            score += 1;

        if (modeRooms.HasValue && f.Rooms == modeRooms.Value)
            score += 1.5;

        return score;
    }
}
