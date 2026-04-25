using System.Security.Claims;
using FlatFinder.Api.DTOs;
using FlatFinder.Api.Models;
using FlatFinder.Api.Options;
using FlatFinder.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace FlatFinder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly ITokenService _tokens;
    private readonly JwtOptions _jwt;

    public AuthController(
        UserManager<ApplicationUser> users,
        ITokenService tokens,
        IOptions<JwtOptions> jwt)
    {
        _users = users;
        _tokens = tokens;
        _jwt = jwt.Value;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var existing = await _users.FindByEmailAsync(request.Email);
        if (existing != null)
            return Conflict(new { error = "An account with this email already exists." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)
                ? request.Email.Split('@')[0]
                : request.DisplayName!.Trim()
        };

        var result = await _users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { error = string.Join(" ", result.Errors.Select(e => e.Description)) });

        return await BuildAuthResponseAsync(user, ct);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var user = await _users.FindByEmailAsync(request.Email);
        if (user == null)
            return Unauthorized(new { error = "Invalid email or password." });

        var valid = await _users.CheckPasswordAsync(user, request.Password);
        if (!valid)
            return Unauthorized(new { error = "Invalid email or password." });

        return await BuildAuthResponseAsync(user, ct);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<object>> Me(CancellationToken ct)
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id == null) return Unauthorized();
        var user = await _users.FindByIdAsync(id);
        if (user == null) return Unauthorized();
        return Ok(new { user.Email, user.DisplayName });
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(ApplicationUser user, CancellationToken ct)
    {
        await Task.Yield();
        var token = _tokens.CreateToken(user);
        return new AuthResponse
        {
            Token = token,
            Email = user.Email ?? user.UserName ?? "",
            DisplayName = user.DisplayName,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(_jwt.ExpiryMinutes)
        };
    }
}
