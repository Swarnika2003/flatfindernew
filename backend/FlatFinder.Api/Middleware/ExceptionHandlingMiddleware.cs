using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace FlatFinder.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteErrorAsync(context, ex);
        }
    }

    private async Task WriteErrorAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";
        var (status, message) = ex switch
        {
            DbUpdateConcurrencyException => (HttpStatusCode.Conflict,
                "The record changed. Refresh and try again."),
            DbUpdateException => (HttpStatusCode.ServiceUnavailable,
                "We could not complete that action right now. Please try again shortly."),
            _ => (HttpStatusCode.InternalServerError,
                _env.IsDevelopment() ? ex.Message : "Something went wrong.")
        };
        context.Response.StatusCode = (int)status;
        var payload = JsonSerializer.Serialize(new { error = message, traceId = context.TraceIdentifier });
        await context.Response.WriteAsync(payload);
    }
}
