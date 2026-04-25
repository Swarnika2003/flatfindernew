using FlatFinder.Api.DTOs;
using FlatFinder.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlatFinder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _recommendation;

    public RecommendationsController(IRecommendationService recommendation) => _recommendation = recommendation;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FlatDto>>> Get([FromQuery] int take = 8, CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        take = Math.Clamp(take, 1, 24);
        var flats = await _recommendation.GetRecommendationsAsync(userId, take, ct);
        var dtos = flats.Select(f => new FlatDto
        {
            Id = f.Id,
            Title = f.Title,
            Description = f.Description,
            LocationArea = f.LocationArea,
            City = f.City,
            PriceMonthly = f.PriceMonthly,
            Rooms = f.Rooms,
            AreaSqM = f.AreaSqM,
            ListedAt = f.ListedAt
        }).ToList();
        return Ok(dtos);
    }
}
