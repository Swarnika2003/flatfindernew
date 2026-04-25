using FlatFinder.Api.Data;
using FlatFinder.Api.DTOs;
using FlatFinder.Api.Hubs;
using FlatFinder.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FlatFinder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PreferencesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<ListingHub> _hub;

    public PreferencesController(AppDbContext db, IHubContext<ListingHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpGet]
    public async Task<ActionResult<PreferenceDto>> Get(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var p = await _db.UserPreferences.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (p == null)
            return Ok(new PreferenceDto { UpdatedAt = DateTimeOffset.UtcNow });

        return Ok(new PreferenceDto
        {
            MinPrice = p.MinPrice,
            MaxPrice = p.MaxPrice,
            PreferredRooms = p.PreferredRooms,
            PreferredAreas = p.PreferredAreas,
            UpdatedAt = p.UpdatedAt
        });
    }

    [HttpPut]
    public async Task<ActionResult<PreferenceDto>> Put([FromBody] PreferenceRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        if (request.MinPrice.HasValue && request.MaxPrice.HasValue && request.MinPrice > request.MaxPrice)
            return BadRequest(new { error = "Minimum price cannot be greater than maximum price." });

        var p = await _db.UserPreferences.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (p == null)
        {
            p = new UserPreference { UserId = userId };
            _db.UserPreferences.Add(p);
        }

        p.MinPrice = request.MinPrice;
        p.MaxPrice = request.MaxPrice;
        p.PreferredRooms = request.PreferredRooms;
        p.PreferredAreas = string.IsNullOrWhiteSpace(request.PreferredAreas) ? null : request.PreferredAreas.Trim();
        p.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
        await _hub.Clients.Group(userId).SendAsync("preferencesUpdated", ct);

        return Ok(new PreferenceDto
        {
            MinPrice = p.MinPrice,
            MaxPrice = p.MaxPrice,
            PreferredRooms = p.PreferredRooms,
            PreferredAreas = p.PreferredAreas,
            UpdatedAt = p.UpdatedAt
        });
    }
}
