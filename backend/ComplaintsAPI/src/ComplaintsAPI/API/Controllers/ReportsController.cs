using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Application.DTOs;
using ComplaintsAPI.Infrastructure.Data;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>Genel şikayet istatistikleri</summary>
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        var totals = await _context.Complaints
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Open = g.Count(c => c.Status == "Acik"),
                Closed = g.Count(c => c.Status == "Kapali")
            })
            .FirstOrDefaultAsync();

        var byDepartment = await _context.Complaints
            .AsNoTracking()
            .GroupBy(c => c.CurrentDepartment != null ? c.CurrentDepartment.Name : "Bilinmiyor")
            .Select(g => new DepartmentStatDto(g.Key, g.Count()))
            .ToListAsync();

        var result = new ComplaintStatisticsDto(
            TotalComplaints: totals?.Total ?? 0,
            OpenComplaints: totals?.Open ?? 0,
            ClosedComplaints: totals?.Closed ?? 0,
            ByDepartment: byDepartment
        );

        return Ok(result);
    }

    /// <summary>Departman bazlı şikayet dağılımı</summary>
    [HttpGet("by-department")]
    public async Task<IActionResult> GetByDepartment()
    {
        var result = await _context.Complaints
            .AsNoTracking()
            .GroupBy(c => c.CurrentDepartment != null ? c.CurrentDepartment.Name : "Bilinmiyor")
            .Select(g => new DepartmentStatDto(g.Key, g.Count()))
            .ToListAsync();

        return Ok(result);
    }
}
