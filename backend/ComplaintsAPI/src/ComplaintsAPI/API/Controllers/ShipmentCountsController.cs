using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Infrastructure.Data;
using ComplaintsAPI.Domain.Entities;
using MiniExcelLibs;
using System.Globalization;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShipmentCountsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ShipmentCountsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/shipmentcounts
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var data = await _context.ShipmentCounts
            .OrderByDescending(s => s.ShipmentDate)
            .ToListAsync();
        return Ok(data);
    }

    // POST: api/shipmentcounts/upload
    // Excel yapısı:
    //   Satır 1: Başlıklar (A=Ürün, B=Sevk Tarihi, C=Müşteri, ... G=Sevk Edilen ADET)
    //   Satır 2+: Veriler
    //
    // Eşleştirme mantığı:
    //   1. Complaints tablosundan benzersiz müşteri isimleri çekilir
    //   2. Excel'deki "Müşteri" sütunu, bu isimlere case-insensitive CONTAINS ile eşleştirilir
    //   3. Eşleşen satır → DB'deki müşteri adıyla kaydedilir
    //   4. Eşleşmeyen satırlar atlanır
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Lütfen bir Excel dosyası seçin.");

        try
        {
            Console.WriteLine($"\n---> SEVK IMPORT BAŞLADI: {file.FileName}");

            // 1. Veritabanındaki benzersiz müşteri isimlerini al
            var dbCustomerNames = await _context.Complaints
                .Select(c => c.CustomerName)
                .Distinct()
                .ToListAsync();

            Console.WriteLine($"---> Veritabanında {dbCustomerNames.Count} benzersiz müşteri bulundu.");

            if (!dbCustomerNames.Any())
                return BadRequest("Veritabanında henüz şikayet kaydı (müşteri) bulunamadı. Önce şikayet verilerini içe aktarın.");

            // 2. Excel'i oku
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            var rawRows = ms.Query(useHeaderRow: false).ToList();
            Console.WriteLine($"---> Toplam ham satır: {rawRows.Count}");

            if (rawRows.Count < 2)
                return BadRequest("Excel dosyasında yeterli satır bulunamadı.");

            // İlk satır başlık — kolon haritası oluştur
            var headerRow = rawRows[0] as IDictionary<string, object>;
            if (headerRow == null)
                return BadRequest("Excel başlık satırı okunamadı.");

            var columnMap = new Dictionary<string, string>();
            foreach (var key in headerRow.Keys)
            {
                var headerValue = headerRow[key]?.ToString()?.Trim() ?? "";
                if (!string.IsNullOrEmpty(headerValue))
                    columnMap[key] = headerValue;
            }

            Console.WriteLine("---> Kolon Haritası: " + string.Join(" | ", columnMap.Select(kv => $"{kv.Key}={kv.Value}")));

            // Kolon harflerini bul
            string? musteriCol = null, sevkTarihiCol = null, sevkAdetCol = null;
            foreach (var kv in columnMap)
            {
                var normalized = NormalizeKey(kv.Value);
                if (normalized.Contains("musteri") || normalized.Contains("müşteri") || normalized.Contains("musteri"))
                    musteriCol = kv.Key;
                else if (normalized.Contains("sevktarihi"))
                    sevkTarihiCol = kv.Key;
                else if (normalized.Contains("sevkedilenadet") || normalized.Contains("sevkadet"))
                    sevkAdetCol = kv.Key;
            }

            if (musteriCol == null || sevkTarihiCol == null || sevkAdetCol == null)
            {
                Console.WriteLine($"---> HATA: Kolon bulunamadı! Müşteri={musteriCol}, SevkTarihi={sevkTarihiCol}, SevkAdet={sevkAdetCol}");
                return BadRequest($"Excel'de gerekli sütunlar bulunamadı. Müşteri={musteriCol != null}, SevkTarihi={sevkTarihiCol != null}, SevkAdet={sevkAdetCol != null}");
            }

            Console.WriteLine($"---> Eşleşen kolonlar: Müşteri={musteriCol}, SevkTarihi={sevkTarihiCol}, SevkAdet={sevkAdetCol}");

            // 3. Mevcut sevk kayıtlarını al (duplicate kontrolü için)
            var existingShipments = await _context.ShipmentCounts.ToListAsync();

            // 4. Her veri satırını işle
            var shipments = new List<ShipmentCount>();
            int matched = 0, skipped = 0, duplicateSkipped = 0;

            foreach (var rawRow in rawRows.Skip(1))
            {
                var row = rawRow as IDictionary<string, object>;
                if (row == null) continue;

                // Müşteri adını al
                var excelMusteri = row.ContainsKey(musteriCol) ? row[musteriCol]?.ToString()?.Trim() : null;
                if (string.IsNullOrWhiteSpace(excelMusteri))
                {
                    skipped++;
                    continue;
                }

                // Veritabanındaki müşteri ile eşleştir (case-insensitive contains)
                var matchedCustomer = FindMatchingCustomer(excelMusteri, dbCustomerNames);
                if (matchedCustomer == null)
                {
                    skipped++;
                    continue;
                }

                // Sevk Tarihi
                var sevkTarihiRaw = row.ContainsKey(sevkTarihiCol) ? row[sevkTarihiCol] : null;
                var sevkTarihi = ParseDate(sevkTarihiRaw);

                // Sevk Adedi
                var sevkAdetRaw = row.ContainsKey(sevkAdetCol) ? row[sevkAdetCol] : null;
                int sevkAdet = ParseInt(sevkAdetRaw);
                if (sevkAdet <= 0)
                {
                    skipped++;
                    continue;
                }

                // Duplicate kontrolü: aynı müşteri + aynı tarih + aynı adet varsa atla
                bool isDuplicate = existingShipments.Any(s =>
                    s.CustomerName.Equals(matchedCustomer, StringComparison.OrdinalIgnoreCase) &&
                    s.ShipmentDate.Date == sevkTarihi.Date &&
                    s.ShipmentQuantity == sevkAdet);

                if (isDuplicate)
                {
                    duplicateSkipped++;
                    continue;
                }

                shipments.Add(new ShipmentCount
                {
                    CustomerName = matchedCustomer,
                    ShipmentDate = sevkTarihi,
                    ShipmentQuantity = sevkAdet
                });

                matched++;
            }

            Console.WriteLine($"---> Eşleşen: {matched}, Atlanan: {skipped}, Mükerrer: {duplicateSkipped}");

            if (shipments.Any())
            {
                await _context.ShipmentCounts.AddRangeAsync(shipments);
                await _context.SaveChangesAsync();
                Console.WriteLine($"---> BAŞARILI: {shipments.Count} sevk kaydı eklendi.");
            }

            return Ok(new
            {
                Message = $"{shipments.Count} sevk kaydı başarıyla eklendi. ({skipped} satır eşleşmedi, {duplicateSkipped} mükerrer atlandı)"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"---> SEVK IMPORT HATA: {ex.Message}");
            return StatusCode(500, $"Excel okuma sırasında hata oluştu: {ex.Message}");
        }
    }

    /// <summary>
    /// Excel'deki müşteri adını, veritabanındaki müşteri adlarıyla case-insensitive contains ile eşleştirir.
    /// Önce tam eşleşme aranır, sonra contains ile en uzun eşleşen seçilir.
    /// </summary>
    private string? FindMatchingCustomer(string excelCustomer, List<string> dbCustomerNames)
    {
        var excelNormalized = excelCustomer.Trim().ToLowerInvariant();

        // 1. Önce tam eşleşme (case-insensitive)
        var exactMatch = dbCustomerNames.FirstOrDefault(db =>
            db.Equals(excelCustomer, StringComparison.OrdinalIgnoreCase));
        if (exactMatch != null) return exactMatch;

        // 2. Contains eşleşme — DB'deki isim Excel'in içinde geçiyor mu?
        //    Birden fazla eşleşme varsa en uzun olanı seç (daha spesifik eşleşme)
        var containsMatches = dbCustomerNames
            .Where(db => excelNormalized.Contains(db.ToLowerInvariant()))
            .OrderByDescending(db => db.Length)
            .ToList();

        if (containsMatches.Any())
            return containsMatches.First();

        // 3. Tersi: Excel'deki isim DB'nin içinde geçiyor mu?
        var reverseMatches = dbCustomerNames
            .Where(db => db.ToLowerInvariant().Contains(excelNormalized))
            .OrderBy(db => db.Length)
            .ToList();

        if (reverseMatches.Any())
            return reverseMatches.First();

        return null;
    }

    // DELETE: api/shipmentcounts/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _context.ShipmentCounts.FindAsync(id);
        if (entity == null) return NotFound("Kayıt bulunamadı.");
        _context.ShipmentCounts.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/shipmentcounts — Tüm sevk kayıtlarını sil
    [HttpDelete]
    public async Task<IActionResult> DeleteAll()
    {
        await _context.ShipmentCounts.ExecuteDeleteAsync();
        return Ok(new { Message = "Tüm sevk kayıtları silindi." });
    }

    private string NormalizeKey(string key)
    {
        if (string.IsNullOrEmpty(key)) return "";
        string normalized = key.ToLowerInvariant().Replace(" ", "").Trim();
        return normalized
            .Replace("\u015f", "s").Replace("\u00e7", "c")
            .Replace("\u0131", "i").Replace("\u00fc", "u")
            .Replace("\u00f6", "o").Replace("\u011f", "g")
            .Replace("ş", "s").Replace("ç", "c")
            .Replace("ı", "i").Replace("ü", "u")
            .Replace("ö", "o").Replace("ğ", "g");
    }

    private DateTime ParseDate(object? value)
    {
        if (value == null || string.IsNullOrWhiteSpace(value.ToString())) return DateTime.UtcNow;
        if (value is DateTime dt) return dt;
        if (DateTime.TryParse(value.ToString(), out var result)) return result;
        return DateTime.UtcNow;
    }

    private int ParseInt(object? value)
    {
        if (value == null || string.IsNullOrWhiteSpace(value.ToString())) return 0;
        if (value is int i) return i;
        if (value is double d) return (int)d;
        if (value is float f) return (int)f;
        // Bazı hücrelerde "\xa0" (non-breaking space) olabiliyor
        var cleaned = value.ToString()?.Replace("\u00a0", "").Trim() ?? "";
        if (int.TryParse(cleaned, out var result)) return result;
        if (double.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out double dResult))
            return (int)dResult;
        return 0;
    }
}
