using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Infrastructure.Data;
using ComplaintsAPI.Domain.Entities;
using MiniExcelLibs;
using System.Globalization;

namespace ComplaintsAPI.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductionCountsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductionCountsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/productioncounts
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var data = await _context.ProductionCounts
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .ToListAsync();
        return Ok(data);
    }

    // POST: api/productioncounts
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductionCountDto dto)
    {
        if (dto.Year < 2000 || dto.Year > 2100) return BadRequest("Geçersiz yıl değeri.");
        if (dto.Month < 1 || dto.Month > 12) return BadRequest("Geçersiz ay değeri.");
        if (dto.Hsa1Count < 0 || dto.Hsa2Count < 0) return BadRequest("Üretim sayısı negatif olamaz.");

        var existing = await _context.ProductionCounts
            .FirstOrDefaultAsync(p => p.Year == dto.Year && p.Month == dto.Month);

        if (existing != null)
            return BadRequest("Seçilen ay için zaten bir üretim kaydı mevcut. Güncelleme işlemi yapılamaz. LÜTFEN BT EKİBİNİZLE İLETİŞİME GEÇİN.");

        int totalCount = (dto.Hsa1Count ?? 0) + (dto.Hsa2Count ?? 0);
        var entity = new ProductionCount
        {
            Year = dto.Year,
            Month = dto.Month,
            Hsa1Count = dto.Hsa1Count,
            Hsa2Count = dto.Hsa2Count,
            Count = totalCount
        };

        _context.ProductionCounts.Add(entity);
        await _context.SaveChangesAsync();
        return Ok(entity);
    }

    // POST: api/productioncounts/upload
    // Excel yapısı:
    //   Satır 1: Boş
    //   Satır 2: Başlıklar  (B=Yıl, C=Ay, G=HSA-1, H=HSA-2, I=Üretim Adedi)
    //   Satır 3+: Veriler
    //     B sütunu: Yıl - BİRLEŞTİRİLMİŞ HÜCRE (sadece ilk satırda değer var)
    //     C sütunu: Ay (1-12)
    //     G sütunu: HSA-1 üretim adedi
    //     H sütunu: HSA-2 üretim adedi
    //     I sütunu: Toplam üretim adedi
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Lütfen bir Excel dosyası seçin.");

        try
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            var sheetNames = ms.GetSheetNames().ToList();
            string targetSheet = sheetNames.FirstOrDefault(s => s.IndexOf("Sayfa2", StringComparison.OrdinalIgnoreCase) >= 0) 
                                 ?? sheetNames.LastOrDefault(); // Usually the production info is on the 2nd sheet

            var allRows = ms.Query(sheetName: targetSheet, useHeaderRow: false).ToList();

            Console.WriteLine($"[EXCEL UPLOAD] Hedef Sayfa: {targetSheet}, Toplam satır: {allRows.Count}");

            if (allRows.Count < 3)
                return BadRequest("Excel dosyasında yeterli satır bulunamadı. En az 3 satır gerekli (1.boş, 2.başlık, 3+.veri).");

            // 2. satır (index=1) başlık satırı - atla
            // 3. satırdan (index=2) itibaren veri başlar
            var dataRows = allRows.Skip(2)
                .Select(r => r as IDictionary<string, object>)
                .Where(r => r != null)
                .ToList();

            // İlk 5 satırı logla (debug)
            for (int i = 0; i < Math.Min(5, allRows.Count); i++)
            {
                var r = allRows[i] as IDictionary<string, object>;
                if (r != null)
                    Console.WriteLine($"[EXCEL] Satır {i + 1}: {string.Join(" | ", r.Select(kv => $"{kv.Key}={kv.Value}"))}");
            }

            // --- Birleştirilmiş yıl hücresini okumak için fill-down mantığı ---
            // B sütunundaki yıl değeri birleştirilmiş hücrede: sadece ilk satırda var.
            // Boş geldiğinde bir önceki yılı kullan.
            var parsed = new List<(int Year, int Month, int H1, int H2, int Total)>();
            int lastYear = 0;

            foreach (var row in dataRows)
            {
                // B sütunu: Yıl
                var bRaw = row.ContainsKey("B") ? row["B"] : null;
                if (bRaw != null && !string.IsNullOrWhiteSpace(bRaw.ToString()))
                {
                    if (TryParseNum(bRaw, out double bNum) && bNum >= 2000 && bNum <= 2100)
                        lastYear = (int)bNum;
                }

                if (lastYear == 0) continue; // Henüz yıl görülmedi

                // C sütunu: Ay
                var cRaw = row.ContainsKey("C") ? row["C"] : null;
                if (cRaw == null || string.IsNullOrWhiteSpace(cRaw.ToString())) continue;
                if (!TryParseNum(cRaw, out double cNum)) continue;
                int month = (int)cNum;
                if (month < 1 || month > 12) continue;

                // G sütunu: HSA-1
                int h1 = ParseInt(row.ContainsKey("G") ? row["G"] : null);
                // H sütunu: HSA-2
                int h2 = ParseInt(row.ContainsKey("H") ? row["H"] : null);
                // I sütunu: Toplam
                int total = ParseInt(row.ContainsKey("I") ? row["I"] : null);
                if (total == 0) total = h1 + h2;

                parsed.Add((lastYear, month, h1, h2, total));
                Console.WriteLine($"[EXCEL] Okunan: Yıl={lastYear} Ay={month} HSA1={h1} HSA2={h2} Toplam={total}");
            }

            if (!parsed.Any())
            {
                var firstDataRow = dataRows.FirstOrDefault();
                string debugStr = firstDataRow != null
                    ? string.Join(" | ", firstDataRow.Select(kv => $"{kv.Key}={kv.Value}"))
                    : "Satır yok";
                return BadRequest($"Excel'den okunabilir veri bulunamadı. İlk veri satırı: [{debugStr}]");
            }

            // Aynı yıl+ay kombinasyonlarını grupla (mükerrer satır varsa son değeri al)
            var grouped = parsed
                .GroupBy(x => new { x.Year, x.Month })
                .Select(g => (g.Key.Year, g.Key.Month, g.Last().H1, g.Last().H2, g.Last().Total))
                .ToList();

            // Mevcut kayıtları getir (güncelleme veya ekleme yapılacak)
            var years = grouped.Select(g => g.Year).Distinct().ToList();
            var existingRecords = await _context.ProductionCounts
                .Where(p => years.Contains(p.Year))
                .ToListAsync();

            int added = 0, updated = 0;
            foreach (var (yr, mo, h1, h2, total) in grouped)
            {
                var existing = existingRecords.FirstOrDefault(p => p.Year == yr && p.Month == mo);
                if (existing != null)
                {
                    existing.Hsa1Count = h1;
                    existing.Hsa2Count = h2;
                    existing.Count = total;
                    existing.UpdatedAt = DateTime.UtcNow;
                    updated++;
                }
                else
                {
                    _context.ProductionCounts.Add(new ProductionCount
                    {
                        Year = yr,
                        Month = mo,
                        Hsa1Count = h1,
                        Hsa2Count = h2,
                        Count = total
                    });
                    added++;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = $"{added} yeni kayıt eklendi, {updated} kayıt güncellendi." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EXCEL UPLOAD HATA] {ex}");
            return StatusCode(500, $"Excel okuma sırasında hata oluştu: {ex.Message}");
        }
    }

    private bool TryParseNum(object? val, out double result)
    {
        result = 0;
        if (val == null) return false;
        if (val is double d) { result = d; return true; }
        if (val is int i) { result = i; return true; }
        if (val is float f) { result = f; return true; }
        return double.TryParse(val.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out result);
    }

    private int ParseInt(object? value)
    {
        if (value == null || string.IsNullOrWhiteSpace(value.ToString())) return 0;
        if (value is int i) return i;
        if (value is double d) return (int)d;
        if (value is float f) return (int)f;
        if (int.TryParse(value.ToString(), out var result)) return result;
        return 0;
    }

    // DELETE: api/productioncounts/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _context.ProductionCounts.FindAsync(id);
        if (entity == null) return NotFound("Kayıt bulunamadı.");
        _context.ProductionCounts.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class ProductionCountDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int? Hsa1Count { get; set; }
    public int? Hsa2Count { get; set; }
}
