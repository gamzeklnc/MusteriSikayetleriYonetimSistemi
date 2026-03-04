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
        var complaints = await _context.Complaints
            .Include(c => c.CurrentDepartment)
            .ToListAsync();

        var byDepartment = complaints
            .GroupBy(c => c.CurrentDepartment.Name)
            .Select(g => new DepartmentStatDto(g.Key, g.Count()));

        var result = new ComplaintStatisticsDto(
            TotalComplaints: complaints.Count,
            OpenComplaints: complaints.Count(c => c.Status == "Acik"),
            ClosedComplaints: complaints.Count(c => c.Status == "Kapali"),
            ByDepartment: byDepartment
        );

        return Ok(result);
    }

    /// <summary>Departman bazlı şikayet dağılımı</summary>
    [HttpGet("by-department")]
    public async Task<IActionResult> GetByDepartment()
    {
        var result = await _context.Complaints
            .Include(c => c.CurrentDepartment)
            .GroupBy(c => c.CurrentDepartment.Name)
            .Select(g => new DepartmentStatDto(g.Key, g.Count()))
            .ToListAsync();

        return Ok(result);
    }
}
