using FlatFinder.Api.Models;

namespace FlatFinder.Api.Services;

public interface IRecommendationService
{
    Task<IReadOnlyList<Flat>> GetRecommendationsAsync(string userId, int take, CancellationToken ct = default);
}
