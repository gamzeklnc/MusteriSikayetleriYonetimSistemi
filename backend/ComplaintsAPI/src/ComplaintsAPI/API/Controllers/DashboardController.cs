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

    private static bool IsClosedStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        var normalized = status.Trim().ToLowerInvariant();
        return normalized.StartsWith("kapali") || normalized.StartsWith("kapal\u0131");
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats(
        [FromQuery] DateTime? startDate = null, 
        [FromQuery] DateTime? endDate = null, 
        [FromQuery] string? brand = null,
        [FromQuery] string? targetCustomer = null,
        [FromQuery] string? targetError = null)
    {
        var query = _context.Complaints
            .AsNoTracking()
            .AsQueryable();

        var normalizedBrand = brand?.Trim().ToUpper();
        var normalizedCustomer = targetCustomer?.Trim().ToUpper();
        var normalizedError = targetError?.Trim().ToUpper();

        if (startDate.HasValue)
            query = query.Where(c => c.ComplaintDate >= startDate.Value);
        
        if (endDate.HasValue)
            query = query.Where(c => c.ComplaintDate <= endDate.Value);

        if (!string.IsNullOrWhiteSpace(normalizedBrand)) 
            query = query.Where(c => c.Brand != null && c.Brand.ToUpper() == normalizedBrand);

        if (!string.IsNullOrWhiteSpace(normalizedCustomer)) 
            query = query.Where(c => c.CustomerName != null && c.CustomerName.ToUpper() == normalizedCustomer);

        if (!string.IsNullOrWhiteSpace(normalizedError)) 
            query = query.Where(c => c.ErrorDefinition != null && c.ErrorDefinition.ToUpper().Contains(normalizedError));

        // Global Stats (No filters)
        var globalQuery = _context.Complaints
            .AsNoTracking()
            .AsQueryable();
        var globalStatusRows = await globalQuery
            .Select(c => new
            {
                c.Status,
                Justified = c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount,
                Unjustified = c.UnjustifiedHsa1Count + c.UnjustifiedHsa2Count + c.UnjustifiedOtherCount
            })
            .ToListAsync();
        var globalTotal = globalStatusRows.Count;
        var globalClosed = globalStatusRows.Count(c => IsClosedStatus(c.Status));
        var globalOpen = globalTotal - globalClosed;
        var globalJustified = globalStatusRows.Sum(c => (long)c.Justified);
        var globalUnjustified = globalStatusRows.Sum(c => (long)c.Unjustified);

        var globalProductionCount = await _context.ProductionCounts
            .AsNoTracking()
            .SumAsync(p => (long)p.Count);
        double globalRatio = globalProductionCount > 0 ? (double)globalJustified * 100 / globalProductionCount : 0;

        // Filtered Stats
        var filteredStatusRows = await query
            .Select(c => new
            {
                c.Status,
                Justified = c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount,
                Unjustified = c.UnjustifiedHsa1Count + c.UnjustifiedHsa2Count + c.UnjustifiedOtherCount
            })
            .ToListAsync();
        var total = filteredStatusRows.Count;
        var closed = filteredStatusRows.Count(c => IsClosedStatus(c.Status));
        var open = total - closed;
        
        // Ürün bazlı haklılık hesaplaması
        var justifiedProducts = filteredStatusRows.Sum(c => (long)c.Justified);
        var unjustifiedProducts = filteredStatusRows.Sum(c => (long)c.Unjustified);
        
        // Filtered production count for the same period
        var filteredProdQuery = _context.ProductionCounts.AsNoTracking().AsQueryable();
        if (startDate.HasValue)
            filteredProdQuery = filteredProdQuery.Where(p => p.Year > startDate.Value.Year || (p.Year == startDate.Value.Year && p.Month >= startDate.Value.Month));
        if (endDate.HasValue)
            filteredProdQuery = filteredProdQuery.Where(p => p.Year < endDate.Value.Year || (p.Year == endDate.Value.Year && p.Month <= endDate.Value.Month));
        var filteredProductionCount = await filteredProdQuery.SumAsync(p => (long)p.Count);

        double ratio = filteredProductionCount > 0 ? (double)justifiedProducts * 100 / filteredProductionCount : 0;

        System.Console.WriteLine($"[DashboardStats] Global - Justified: {globalJustified}, Production: {globalProductionCount}, Ratio: {globalRatio}");

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
            .AsNoTracking()
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
            .AsNoTracking()
            .Where(c => c.ComplaintDate.Year == currentYear && c.ComplaintDate.Month >= 1 && c.ComplaintDate.Month <= 6)
            .SumAsync(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount);

        var firstHalfProduction = await _context.ProductionCounts
            .AsNoTracking()
            .Where(p => p.Year == currentYear && p.Month >= 1 && p.Month <= 6)
            .SumAsync(p => (long)p.Count); // Long for safety

        // 2. Half (Jul-Dec)
        var secondHalfJustified = await _context.Complaints
            .AsNoTracking()
            .Where(c => c.ComplaintDate.Year == currentYear && c.ComplaintDate.Month >= 7 && c.ComplaintDate.Month <= 12)
            .SumAsync(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount);

        var secondHalfProduction = await _context.ProductionCounts
            .AsNoTracking()
            .Where(p => p.Year == currentYear && p.Month >= 7 && p.Month <= 12)
            .SumAsync(p => (long)p.Count);

        // Cumulative (All time)
        var cumulativeJustified = await _context.Complaints
            .AsNoTracking()
            .SumAsync(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount);

        var cumulativeProduction = await _context.ProductionCounts
            .AsNoTracking()
            .SumAsync(p => (long)p.Count);

        var chartData = new JustificationChartDto(
            firstHalfProduction > 0 ? (double)firstHalfJustified * 100 / firstHalfProduction : 0,
            secondHalfProduction > 0 ? (double)secondHalfJustified * 100 / secondHalfProduction : 0,
            cumulativeProduction > 0 ? (double)cumulativeJustified * 100 / cumulativeProduction : 0
        );

        // Yearly Justification Stats
        var productionByYear = await _context.ProductionCounts
            .AsNoTracking()
            .GroupBy(p => p.Year)
            .Select(g => new { Year = g.Key, TotalProduction = g.Sum(p => (long)p.Count) })
            .ToListAsync();

        var justifiedByYear = await _context.Complaints
            .AsNoTracking()
            .GroupBy(c => c.ComplaintDate.Year)
            .Select(g => new { Year = g.Key, TotalJustified = g.Sum(c => c.JustifiedHsa1Count + c.JustifiedHsa2Count + c.JustifiedOtherCount) })
            .ToListAsync();

        var yearlyStats = productionByYear
            .Select(p => new YearlyJustificationDto(
                p.Year,
                p.TotalProduction > 0 ? (double)(justifiedByYear.FirstOrDefault(j => j.Year == p.Year)?.TotalJustified ?? 0) * 100 / p.TotalProduction : 0,
                p.TotalProduction
            ))
            .OrderBy(y => y.Year)
            .ToList();

        // 12-Month Justification Stats for the target year
        int targetYear = endDate?.Year ?? currentYear;
        var monthlyJustificationStats = new List<MonthlyJustificationRateDto>();

        var productionByMonthThisYear = await _context.ProductionCounts
            .AsNoTracking()
            .Where(p => p.Year == targetYear)
            .ToListAsync();

        var justifiedByMonthThisYear = await _context.Complaints
            .AsNoTracking()
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
                prod > 0 ? (double)just * 100 / prod : 0,
                prod
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

        if (!string.IsNullOrWhiteSpace(normalizedBrand))
        {
            if (!startDate.HasValue && !endDate.HasValue)
            {
                // Special case: Single Brand across All Years
                var bUpper = normalizedBrand;
                var yearlyBrandRaw = await _context.Complaints
                    .AsNoTracking()
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
                    .AsNoTracking()
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
                brandStats = brandStats.Where(b => b.BrandName == normalizedBrand).ToList();
            }
        }

        var allBrands = await _context.Complaints
            .AsNoTracking()
            .Where(c => !string.IsNullOrWhiteSpace(c.Brand))
            .Select(c => c.Brand!.Trim().ToUpper())
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        // Error Analysis
        var complaintsWithErrors = await query
            .Where(c => !string.IsNullOrWhiteSpace(c.ErrorDefinition))
            .Select(c => new { c.ErrorDefinition, c.Brand })
            .ToListAsync();

        var errorCounts = new Dictionary<string, Dictionary<string, int>>();

        foreach (var c in complaintsWithErrors)
        {
            var errors = c.ErrorDefinition!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var b = c.Brand?.Trim().ToUpper() ?? "BELİRTİLMEMİŞ";
            foreach (var err in errors)
            {
                if (!errorCounts.ContainsKey(err)) errorCounts[err] = new Dictionary<string, int>();
                if (!errorCounts[err].ContainsKey(b)) errorCounts[err][b] = 0;
                errorCounts[err][b]++;
            }
        }

        var errorStatsDtos = errorCounts.Select(e => new ErrorStatDto(
            e.Key,
            e.Value.Values.Sum(),
            e.Value.Select(b => new BrandBreakdownDto(b.Key, b.Value)).ToList()
        )).OrderByDescending(e => e.TotalCount).Take(10).ToList();

        // HSA Source Analysis
        var sourceRaw = await query
            .GroupBy(_ => 1)
            .Select(g => new {
                H1Total = g.Sum(c => c.JustifiedHsa1Count + c.UnjustifiedHsa1Count),
                H1Just = (int)g.Sum(c => c.JustifiedHsa1Count),
                H2Total = g.Sum(c => c.JustifiedHsa2Count + c.UnjustifiedHsa2Count),
                H2Just = (int)g.Sum(c => c.JustifiedHsa2Count),
                OTotal = g.Sum(c => c.JustifiedOtherCount + c.UnjustifiedOtherCount),
                OJust = (int)g.Sum(c => c.JustifiedOtherCount)
            })
            .OrderBy(n => 1)
            .FirstOrDefaultAsync();

        // Fetch production counts for the same period
        var prodQuery = _context.ProductionCounts.AsNoTracking().AsQueryable();
        if (startDate.HasValue)
            prodQuery = prodQuery.Where(p => p.Year > startDate.Value.Year || (p.Year == startDate.Value.Year && p.Month >= startDate.Value.Month));
        if (endDate.HasValue)
            prodQuery = prodQuery.Where(p => p.Year < endDate.Value.Year || (p.Year == endDate.Value.Year && p.Month <= endDate.Value.Month));

        var prodTotals = await prodQuery
            .GroupBy(_ => 1)
            .Select(g => new {
                H1 = g.Sum(p => (long)p.Hsa1Count),
                H2 = g.Sum(p => (long)p.Hsa2Count)
            })
            .FirstOrDefaultAsync();

        long h1Prod = prodTotals?.H1 ?? 0;
        long h2Prod = prodTotals?.H2 ?? 0;

        var sourceStats = new List<SourceStatDto>
        {
            new SourceStatDto("HSA1", sourceRaw?.H1Total ?? 0, sourceRaw?.H1Just ?? 0, h1Prod, h1Prod > 0 ? (double)(sourceRaw?.H1Just ?? 0) * 100 / h1Prod : 0),
            new SourceStatDto("HSA2", sourceRaw?.H2Total ?? 0, sourceRaw?.H2Just ?? 0, h2Prod, h2Prod > 0 ? (double)(sourceRaw?.H2Just ?? 0) * 100 / h2Prod : 0),
            new SourceStatDto("DİĞER", sourceRaw?.OTotal ?? 0, sourceRaw?.OJust ?? 0)
        };

        // Customer-Error Analysis (8th Quadrant)
        var customerComplaints = await query
            .Where(c => !string.IsNullOrEmpty(c.ErrorDefinition))
            .Select(c => new { c.CustomerName, c.ErrorDefinition, c.DefectiveQuantity })
            .ToListAsync();

        System.Console.WriteLine($"[DEBUG] Card8: Query matches {customerComplaints.Count} complaints.");

        var trCulture = new System.Globalization.CultureInfo("tr-TR");
        var customerErrorCounts = new Dictionary<string, (int ComplaintCount, int ProductCount)>();
        
        foreach (var c in customerComplaints)
        {
            var errors = (c.ErrorDefinition ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var cust = (c.CustomerName ?? "Bilinmiyor").Trim().ToUpper(trCulture);
            
            // Debug: Log if defective quantity is unexpectedly 0
            if (c.DefectiveQuantity == 0) {
                // This might be normal for some data, but let's see if it happens often
                // System.Console.WriteLine($"[DEBUG] Complaint {c.CustomerName} has 0 defective quantity.");
            }

            foreach (var err in errors)
            {
                var errUpper = err.Trim().ToUpper(trCulture);
                
                // If targetError label is specified in query, we can filter further
                if (!string.IsNullOrWhiteSpace(normalizedError)) 
                {
                    var normErrUpper = normalizedError.Trim().ToUpper(trCulture);
                    if (!errUpper.Contains(normErrUpper)) continue;
                }

                // Label logic: If a single customer is selected, show error breakdown. Otherwise show customer distribution.
                string label = string.IsNullOrWhiteSpace(normalizedCustomer) ? cust : err.Trim();
                
                if (!customerErrorCounts.ContainsKey(label)) customerErrorCounts[label] = (0, 0);
                var current = customerErrorCounts[label];
                customerErrorCounts[label] = (current.ComplaintCount + 1, current.ProductCount + c.DefectiveQuantity);
            }
        }

        var customerErrorStats = customerErrorCounts
            .Select(x => new CustomerErrorStatDto(x.Key, x.Value.ComplaintCount, x.Value.ProductCount))
            .OrderByDescending(x => x.ProductCount)
            .Take(10)
            .ToList();

        if (customerErrorStats.Count > 0)
        {
            System.Console.WriteLine($"[DEBUG] Card8: Result count: {customerErrorStats.Count}, Top: {customerErrorStats[0].Label} ({customerErrorStats[0].ProductCount} products)");
        }
        else 
        {
            System.Console.WriteLine("[DEBUG] Card8: NO RESULTS generated after processing.");
        }

        var allCustomers = await _context.Complaints
            .AsNoTracking()
            .Where(c => !string.IsNullOrWhiteSpace(c.CustomerName))
            .Select(c => c.CustomerName.Trim().ToUpper())
            .Distinct().OrderBy(x => x).ToListAsync();

        var allErrorList = await _context.Complaints
            .AsNoTracking()
            .Where(c => !string.IsNullOrWhiteSpace(c.ErrorDefinition))
            .Select(c => c.ErrorDefinition)
            .ToListAsync();
            
        var allErrorLabels = allErrorList
            .SelectMany(e => e!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Select(e => e.Trim().ToUpper())
            .Distinct().OrderBy(x => x).ToList();

        var result = new DashboardStatsDto(
            TotalComplaints: total,
            OpenComplaints: open,
            ClosedComplaints: closed,
            TotalJustifiedProducts: (int)justifiedProducts,
            TotalUnjustifiedProducts: (int)unjustifiedProducts,
            JustifiedRatio: ratio,
            GlobalTotalComplaints: globalTotal,
            GlobalOpenComplaints: globalOpen,
            GlobalClosedComplaints: globalClosed,
            GlobalTotalJustifiedProducts: (int)globalJustified,
            GlobalTotalUnjustifiedProducts: (int)globalUnjustified,
            GlobalJustifiedRatio: globalRatio,
            MonthlyStats: stats,
            JustificationChart: chartData,
            YearlyStats: yearlyStats,
            MonthlyJustificationStats: monthlyJustificationStats,
            BrandStats: brandStats,
            AllBrands: allBrands,
            ErrorStats: errorStatsDtos,
            SourceStats: sourceStats,
            CustomerErrorStats: customerErrorStats,
            AllCustomers: allCustomers,
            AllErrorLabels: allErrorLabels
        );

        return Ok(result);
    }
}
