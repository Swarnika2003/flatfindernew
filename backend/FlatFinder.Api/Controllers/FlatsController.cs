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
public class FlatsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<ListingHub> _hub;

    public FlatsController(AppDbContext db, IHubContext<ListingHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpPost]
    public async Task<ActionResult<FlatDto>> Create(CreateFlatDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var flat = new Flat
        {
            UserId = userId,
            Title = dto.Title,
            Description = dto.Description,
            LocationArea = dto.LocationArea,
            City = dto.City,
            PriceMonthly = dto.PriceMonthly,
            Rooms = dto.Rooms,
            AreaSqM = dto.AreaSqM,
            IsActive = true,
            ListedAt = DateTimeOffset.UtcNow
        };

        _db.Flats.Add(flat);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = flat.Id }, ToDto(flat));
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<FlatDto>>> Search([FromQuery] FlatSearchRequest q, CancellationToken ct)
    {
        if (q.MinPrice.HasValue && q.MaxPrice.HasValue && q.MinPrice > q.MaxPrice)
            return BadRequest(new { error = "Minimum price cannot be greater than maximum price." });

        var page = Math.Clamp(q.Page, 1, 10_000);
        var pageSize = Math.Clamp(q.PageSize, 1, 50);

        var query = _db.Flats.AsNoTracking().Where(f => f.IsActive && f.City == "Kathmandu");

        if (!string.IsNullOrWhiteSpace(q.Location))
        {
            var term = q.Location.Trim();
            query = query.Where(f =>
                f.LocationArea.Contains(term) ||
                f.Title.Contains(term) ||
                f.Description.Contains(term));
        }

        if (q.MinPrice.HasValue)
            query = query.Where(f => f.PriceMonthly >= q.MinPrice.Value);
        if (q.MaxPrice.HasValue)
            query = query.Where(f => f.PriceMonthly <= q.MaxPrice.Value);
        if (q.Rooms.HasValue)
            query = query.Where(f => f.Rooms == q.Rooms.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(f => f.ListedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => ToDto(f))
            .ToListAsync(ct);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            _db.SearchHistories.Add(new SearchHistory
            {
                UserId = userId,
                LocationKeyword = string.IsNullOrWhiteSpace(q.Location) ? null : q.Location.Trim(),
                MinPrice = q.MinPrice,
                MaxPrice = q.MaxPrice,
                Rooms = q.Rooms,
                ResultCount = total,
                SearchedAt = DateTimeOffset.UtcNow
            });
            await _db.SaveChangesAsync(ct);
            await _hub.Clients.Group(userId).SendAsync("searchUpdated", new { total, page, pageSize }, ct);
        }

        return Ok(new PagedResult<FlatDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<FlatDetailDto>> GetById(int id, CancellationToken ct)
    {
        var flat = await _db.Flats.AsNoTracking()
            .Include(f => f.User)
            .Where(f => f.Id == id && f.IsActive)
            .FirstOrDefaultAsync(ct);
        
        if (flat == null) return NotFound();
        
        return Ok(ToDetailDto(flat));
    }

    [HttpGet("my-listings")]
    public async Task<ActionResult<PagedResult<FlatDto>>> GetMyListings([FromQuery] int page = 1, [FromQuery] int pageSize = 12, CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var query = _db.Flats.AsNoTracking().Where(f => f.UserId == userId);
        
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(f => f.ListedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => ToDto(f))
            .ToListAsync(ct);

        return Ok(new PagedResult<FlatDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpPost("{id:int}/favorite")]
    public async Task<ActionResult> AddFavorite(int id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var flat = await _db.Flats.FindAsync(new object[] { id }, cancellationToken: ct);
        if (flat == null) return NotFound();

        var existing = await _db.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.FlatId == id, ct);
        
        if (existing != null)
            return BadRequest(new { error = "Already favorited." });

        _db.Favorites.Add(new Favorite
        {
            UserId = userId,
            FlatId = id,
            FavoritedAt = DateTimeOffset.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("{id:int}/favorite")]
    public async Task<ActionResult> RemoveFavorite(int id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var favorite = await _db.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.FlatId == id, ct);
        
        if (favorite == null)
            return NotFound();

        _db.Favorites.Remove(favorite);
        await _db.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpGet("favorites")]
    public async Task<ActionResult<PagedResult<FavoriteDto>>> GetFavorites([FromQuery] int page = 1, [FromQuery] int pageSize = 12, CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var query = _db.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .Join(_db.Flats, fav => fav.FlatId, flat => flat.Id, (fav, flat) => new { fav, flat })
            .OrderByDescending(x => x.fav.FavoritedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new FavoriteDto
            {
                Id = x.fav.Id,
                FlatId = x.flat.Id,
                Title = x.flat.Title,
                LocationArea = x.flat.LocationArea,
                PriceMonthly = x.flat.PriceMonthly,
                Rooms = x.flat.Rooms,
                AreaSqM = x.flat.AreaSqM,
                FavoritedAt = x.fav.FavoritedAt
            })
            .ToListAsync(ct);

        return Ok(new PagedResult<FavoriteDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    private static FlatDto ToDto(Flat f) => new()
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
    };

    private static FlatDetailDto ToDetailDto(Flat f) => new()
    {
        Id = f.Id,
        Title = f.Title,
        Description = f.Description,
        LocationArea = f.LocationArea,
        City = f.City,
        PriceMonthly = f.PriceMonthly,
        Rooms = f.Rooms,
        AreaSqM = f.AreaSqM,
        ListedAt = f.ListedAt,
        OwnerName = f.User?.DisplayName,
        OwnerEmail = f.User?.Email
    };
}
