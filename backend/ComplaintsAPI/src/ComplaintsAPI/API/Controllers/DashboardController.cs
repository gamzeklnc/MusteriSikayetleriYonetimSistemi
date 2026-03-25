using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Infrastructure.Data;
using ComplaintsAPI.Application.DTOs;

namespace ComplaintsAPI.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var total = await _context.Complaints.CountAsync();
        var open = await _context.Complaints.CountAsync(c => c.Status != "Kapali");
        var closed = await _context.Complaints.CountAsync(c => c.Status == "Kapali");
        
        // Ürün bazlı haklılık hesaplaması
        var justifiedProducts = await _context.Complaints.SumAsync(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount);
        var unjustifiedProducts = await _context.Complaints.SumAsync(c => c.UnjustifiedHsa1Count + c.UnjustifiedHsa2Count + c.UnjustifiedOtherCount);
        
        var totalEvaluated = justifiedProducts + unjustifiedProducts;
        double ratio = totalEvaluated > 0 ? (double)justifiedProducts / totalEvaluated : 0;

        System.Console.WriteLine($"[DashboardStats] Total: {total}, Open: {open}, Closed: {closed}, JustifiedProducts: {justifiedProducts}, Ratio: {ratio}");

        // Aylık İstatistikler (Son 12 Ay)
        var startDate = DateTime.UtcNow.AddMonths(-11).Date;
        startDate = new DateTime(startDate.Year, startDate.Month, 1);

        var monthlyData = await _context.Complaints
            .Where(c => c.RegistrationDate >= startDate)
            .GroupBy(c => new { c.RegistrationDate.Year, c.RegistrationDate.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Count = g.Count()
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        var stats = new List<MonthlyStatDto>();
        int runningTotal = await _context.Complaints
            .Where(c => c.RegistrationDate < startDate)
            .CountAsync();

        // 12 ayı garantiye alalım
        for (int i = 0; i < 12; i++)
        {
            var targetMonth = startDate.AddMonths(i);
            var match = monthlyData.FirstOrDefault(m => m.Year == targetMonth.Year && m.Month == targetMonth.Month);
            
            int currentCount = match?.Count ?? 0;
            runningTotal += currentCount;

            stats.Add(new MonthlyStatDto(
                $"{targetMonth:MM}/{targetMonth:yy}",
                currentCount,
                runningTotal
            ));
        }

        return Ok(new DashboardStatsDto(
            total,
            open,
            closed,
            justifiedProducts,
            unjustifiedProducts,
            ratio,
            stats
        ));
    }
}
