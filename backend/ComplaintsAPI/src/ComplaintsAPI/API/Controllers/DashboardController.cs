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
    public async Task<IActionResult> GetStats([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] string? brand = null)
    {
        var query = _context.Complaints.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(c => c.ComplaintDate >= startDate.Value);
        
        if (endDate.HasValue)
            query = query.Where(c => c.ComplaintDate <= endDate.Value);

        var total = await query.CountAsync();
        var open = await query.CountAsync(c => c.Status != "Kapali");
        var closed = await query.CountAsync(c => c.Status == "Kapali");
        
        // Ürün bazlı haklılık hesaplaması
        var justifiedProducts = await query.SumAsync(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount);
        var unjustifiedProducts = await query.SumAsync(c => c.UnjustifiedHsa1Count + c.UnjustifiedHsa2Count + c.UnjustifiedOtherCount);
        
        var totalEvaluated = justifiedProducts + unjustifiedProducts;
        double ratio = totalEvaluated > 0 ? (double)justifiedProducts / totalEvaluated : 0;

        System.Console.WriteLine($"[DashboardStats] Filtered Total: {total}, JustifiedProducts: {justifiedProducts}, Ratio: {ratio}");

        // Aylık İstatistikler
        DateTime effectiveStartDate = startDate ?? DateTime.UtcNow.AddMonths(-11).Date;
        if (!startDate.HasValue) effectiveStartDate = new DateTime(effectiveStartDate.Year, effectiveStartDate.Month, 1);
        
        DateTime effectiveEndDate = endDate ?? DateTime.UtcNow;

        var monthlyData = await query
            .GroupBy(c => new { c.ComplaintDate.Year, c.ComplaintDate.Month })
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
            .Where(c => c.ComplaintDate < effectiveStartDate)
            .CountAsync();

        // Kaç ay olduğunu hesapla
        int monthCount = ((effectiveEndDate.Year - effectiveStartDate.Year) * 12) + effectiveEndDate.Month - effectiveStartDate.Month + 1;
        if (monthCount < 1) monthCount = 1;
        if (monthCount > 48) monthCount = 48; // Limit to 4 years max for safety

        for (int i = 0; i < monthCount; i++)
        {
            var targetMonth = effectiveStartDate.AddMonths(i);
            if (targetMonth > effectiveEndDate) break;

            var match = monthlyData.FirstOrDefault(m => m.Year == targetMonth.Year && m.Month == targetMonth.Month);
            
            int currentCount = match?.Count ?? 0;
            runningTotal += currentCount;

            stats.Add(new MonthlyStatDto(
                $"{targetMonth:MM}/{targetMonth:yy}",
                currentCount,
                runningTotal
            ));
        }

        // Justification Chart Calculations
        int currentYear = DateTime.UtcNow.Year;

        // 1. Half (Jan-Jun)
        var firstHalfJustified = await _context.Complaints
            .Where(c => c.ComplaintDate.Year == currentYear && c.ComplaintDate.Month >= 1 && c.ComplaintDate.Month <= 6)
            .SumAsync(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount);

        var firstHalfProduction = await _context.ProductionCounts
            .Where(p => p.Year == currentYear && p.Month >= 1 && p.Month <= 6)
            .SumAsync(p => (long)p.Count); // Long for safety

        // 2. Half (Jul-Dec)
        var secondHalfJustified = await _context.Complaints
            .Where(c => c.ComplaintDate.Year == currentYear && c.ComplaintDate.Month >= 7 && c.ComplaintDate.Month <= 12)
            .SumAsync(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount);

        var secondHalfProduction = await _context.ProductionCounts
            .Where(p => p.Year == currentYear && p.Month >= 7 && p.Month <= 12)
            .SumAsync(p => (long)p.Count);

        // Cumulative (All time)
        var cumulativeJustified = await _context.Complaints
            .SumAsync(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount);

        var cumulativeProduction = await _context.ProductionCounts
            .SumAsync(p => (long)p.Count);

        var chartData = new JustificationChartDto(
            firstHalfProduction > 0 ? (double)firstHalfJustified * 100 / firstHalfProduction : 0,
            secondHalfProduction > 0 ? (double)secondHalfJustified * 100 / secondHalfProduction : 0,
            cumulativeProduction > 0 ? (double)cumulativeJustified * 100 / cumulativeProduction : 0
        );

        // Yearly Justification Stats
        var productionByYear = await _context.ProductionCounts
            .GroupBy(p => p.Year)
            .Select(g => new { Year = g.Key, TotalProduction = g.Sum(p => (long)p.Count) })
            .ToListAsync();

        var justifiedByYear = await _context.Complaints
            .GroupBy(c => c.ComplaintDate.Year)
            .Select(g => new { Year = g.Key, TotalJustified = g.Sum(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount) })
            .ToListAsync();

        var yearlyStats = productionByYear
            .Select(p => new YearlyJustificationDto(
                p.Year,
                p.TotalProduction > 0 ? (double)(justifiedByYear.FirstOrDefault(j => j.Year == p.Year)?.TotalJustified ?? 0) * 100 / p.TotalProduction : 0
            ))
            .OrderBy(y => y.Year)
            .ToList();

        // 12-Month Justification Stats for the target year
        int targetYear = endDate?.Year ?? currentYear;
        var monthlyJustificationStats = new List<MonthlyJustificationRateDto>();

        var productionByMonthThisYear = await _context.ProductionCounts
            .Where(p => p.Year == targetYear)
            .ToListAsync();

        var justifiedByMonthThisYear = await _context.Complaints
            .Where(c => c.ComplaintDate.Year == targetYear)
            .GroupBy(c => c.ComplaintDate.Month)
            .Select(g => new { Month = g.Key, TotalJustified = g.Sum(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount) })
            .ToListAsync();

        for (int m = 1; m <= 12; m++)
        {
            var prod = productionByMonthThisYear.FirstOrDefault(p => p.Month == m)?.Count ?? 0;
            var just = justifiedByMonthThisYear.FirstOrDefault(j => j.Month == m)?.TotalJustified ?? 0;
            
            monthlyJustificationStats.Add(new MonthlyJustificationRateDto(
                m,
                prod > 0 ? (double)just * 100 / prod : 0
            ));
        }

        // Brand-based Stats for the target year
        long totalYearlyProduction = productionByMonthThisYear.Sum(p => (long)p.Count);
        
        var brandStatsRaw = await query
            .Where(c => !string.IsNullOrWhiteSpace(c.Brand))
            .GroupBy(c => c.Brand!.Trim().ToUpper())
            .Select(g => new 
            { 
                BrandName = g.Key, 
                ComplaintProductCount = g.Sum(c => c.DefectiveQuantity),
                JustifiedProductCount = g.Sum(c => (long)(c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount))
            })
            .ToListAsync();

        var brandStats = brandStatsRaw
            .Select(b => new BrandStatDto(
                b.BrandName ?? "Bilinmiyor",
                b.ComplaintProductCount,
                totalYearlyProduction > 0 ? (double)b.JustifiedProductCount * 100 / totalYearlyProduction : 0
            ))
            .OrderByDescending(b => b.ComplaintCount)
            .ToList();

        if (!string.IsNullOrWhiteSpace(brand))
        {
            if (!startDate.HasValue && !endDate.HasValue)
            {
                // Special case: Single Brand across All Years
                var bUpper = brand.Trim().ToUpper();
                var yearlyBrandRaw = await _context.Complaints
                    .Where(c => !string.IsNullOrWhiteSpace(c.Brand) && c.Brand.Trim().ToUpper() == bUpper)
                    .GroupBy(c => c.ComplaintYear)
                    .Select(g => new { 
                        Year = g.Key, 
                        Count = g.Sum(c => c.DefectiveQuantity),
                        Justified = g.Sum(c => (long)(c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount))
                    })
                    .ToListAsync();

                var yearListForProduction = yearlyBrandRaw.Select(y => y.Year).ToList();
                var productionsForYears = await _context.ProductionCounts
                    .Where(p => yearListForProduction.Contains(p.Year))
                    .GroupBy(p => p.Year)
                    .Select(g => new { Year = g.Key, Total = g.Sum(p => (long)p.Count) })
                    .ToListAsync();

                brandStats = yearlyBrandRaw.Select(y => new BrandStatDto(
                    y.Year.ToString(),
                    y.Count,
                    productionsForYears.FirstOrDefault(p => p.Year == y.Year)?.Total > 0 
                        ? (double)y.Justified * 100 / productionsForYears.FirstOrDefault(p => p.Year == y.Year)!.Total 
                        : 0
                )).OrderBy(y => y.BrandName).ToList();
            }
            else
            {
                brandStats = brandStats.Where(b => b.BrandName == brand.Trim().ToUpper()).ToList();
            }
        }

        var allBrands = await _context.Complaints
            .Where(c => !string.IsNullOrWhiteSpace(c.Brand))
            .Select(c => c.Brand!.Trim().ToUpper())
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        return Ok(new DashboardStatsDto(
            total,
            open,
            closed,
            justifiedProducts,
            unjustifiedProducts,
            ratio,
            stats,
            chartData,
            yearlyStats,
            monthlyJustificationStats,
            brandStats,
            allBrands
        ));
    }
}
