using FlatFinder.Api.Data;
using FlatFinder.Api.DTOs;
using FlatFinder.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FlatFinder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly AppDbContext _db;

    public MessagesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult> SendMessage(CreateMessageDto dto, CancellationToken ct)
    {
        var flat = await _db.Flats
            .Include(f => f.User)
            .FirstOrDefaultAsync(f => f.Id == dto.FlatId, ct);
        
        if (flat == null || flat.User == null)
            return NotFound(new { error = "Flat or owner not found." });

        var message = new Message
        {
            SenderId = "anonymous",
            ReceiverId = flat.UserId!,
            FlatId = dto.FlatId,
            Subject = dto.Subject,
            Body = dto.Body,
            SenderEmail = dto.SenderEmail,
            SenderPhone = dto.SenderPhone,
            SentAt = DateTimeOffset.UtcNow,
            IsRead = false
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync(ct);

        return Ok(new { id = message.Id });
    }

    [HttpGet("inbox")]
    [Authorize]
    public async Task<ActionResult<PagedResult<MessageDto>>> GetInbox([FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var query = _db.Messages
            .AsNoTracking()
            .Where(m => m.ReceiverId == userId)
            .Include(m => m.Flat)
            .OrderByDescending(m => m.SentAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                Subject = m.Subject,
                Body = m.Body,
                SenderEmail = m.SenderEmail,
                SenderPhone = m.SenderPhone,
                SenderName = m.SenderId == "anonymous" ? "Anonymous" : m.Sender!.DisplayName,
                FlatId = m.FlatId,
                FlatTitle = m.Flat!.Title,
                SentAt = m.SentAt,
                IsRead = m.IsRead
            })
            .ToListAsync(ct);

        return Ok(new PagedResult<MessageDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpPut("{id:int}/read")]
    [Authorize]
    public async Task<ActionResult> MarkAsRead(int id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var message = await _db.Messages.FirstOrDefaultAsync(m => m.Id == id && m.ReceiverId == userId, ct);
        if (message == null) return NotFound();

        message.IsRead = true;
        await _db.SaveChangesAsync(ct);

        return Ok();
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<ActionResult<MessageDto>> GetMessage(int id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var message = await _db.Messages
            .AsNoTracking()
            .Include(m => m.Flat)
            .FirstOrDefaultAsync(m => m.Id == id && m.ReceiverId == userId, ct);
        
        if (message == null) return NotFound();

        return Ok(new MessageDto
        {
            Id = message.Id,
            Subject = message.Subject,
            Body = message.Body,
            SenderEmail = message.SenderEmail,
            SenderPhone = message.SenderPhone,
            SenderName = message.SenderId == "anonymous" ? "Anonymous" : message.Sender?.DisplayName ?? "Unknown",
            FlatId = message.FlatId,
            FlatTitle = message.Flat!.Title,
            SentAt = message.SentAt,
            IsRead = message.IsRead
        });
    }
}
