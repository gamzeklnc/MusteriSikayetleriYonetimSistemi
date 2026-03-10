using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Application.DTOs;
using ComplaintsAPI.Infrastructure.Data;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserActivityLogsController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserActivityLogsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var logs = await _context.UserActivityLogs
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new UserActivityLogDto(
                l.Id,
                l.UserId,
                l.UserFullName,
                l.Action,
                l.Details,
                l.CreatedAt
            ))
            .ToListAsync();

        return Ok(logs);
    }
}
