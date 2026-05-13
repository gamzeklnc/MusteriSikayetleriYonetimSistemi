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

            // 0. ESKİ KAYITLARI OTOMATİK SİL (Yeni talep: Her yüklemede sıfırla)
            await _context.ShipmentCounts.ExecuteDeleteAsync();
            Console.WriteLine("---> Eski sevk kayıtları temizlendi.");

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

            // 4. Her veri satırını işle
            var shipments = new List<ShipmentCount>();
            int matched = 0, skipped = 0;

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

                // Veritabanındaki müşteri ile eşleştir
                var matchedCustomer = FindMatchingCustomer(excelMusteri, dbCustomerNames);
                
                // Sevk Tarihi ve Adedi
                var sevkTarihi = ParseDate(row.ContainsKey(sevkTarihiCol) ? row[sevkTarihiCol] : null);
                int sevkAdet = ParseInt(row.ContainsKey(sevkAdetCol) ? row[sevkAdetCol] : null);

                // Kaydı her halükarda ekliyoruz (Tüm sevkleri toplamak için)
                shipments.Add(new ShipmentCount
                {
                    // Eğer eşleştiyse DB ismini kullan, yoksa Excel ismini
                    CustomerName = matchedCustomer ?? excelMusteri,
                    ShipmentDate = sevkTarihi,
                    ShipmentQuantity = sevkAdet,
                    IsMatched = matchedCustomer != null
                });

                if (matchedCustomer != null) matched++;
            }

            Console.WriteLine($"---> Toplam Excel Satırı: {shipments.Count}, Eşleşen Müşteri: {matched}, Boş Satır: {skipped}");

            if (shipments.Any())
            {
                await _context.ShipmentCounts.AddRangeAsync(shipments);
                await _context.SaveChangesAsync();
                Console.WriteLine($"---> BAŞARILI: {shipments.Count} sevk kaydı eklendi.");
            }

            return Ok(new
            {
                Message = $"{shipments.Count} sevk kaydı başarıyla eklendi. ({matched} tanesi sistemdeki müşterilerle eşleşti)"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"---> SEVK IMPORT HATA: {ex.Message}");
            return StatusCode(500, $"Excel okuma sırasında hata oluştu: {ex.Message}");
        }
    }

    /// <summary>
    /// Excel'deki müşteri adını, veritabanındaki müşteri adlarıyla süper-esnek bir şekilde eşleştirir.
    /// Boşlukları, noktalamaları kaldırır ve Türkçe karakterleri normalize eder.
    /// </summary>
    private string? FindMatchingCustomer(string excelCustomer, List<string> dbCustomerNames)
    {
        if (string.IsNullOrWhiteSpace(excelCustomer)) return null;

        var normalizedExcel = CleanForComparison(excelCustomer);
        if (string.IsNullOrEmpty(normalizedExcel)) return null;

        // Kullanıcının istediği kesin mantık:
        // Database'deki her müşterinin normalize hali, Excel'deki ismin içinde GEÇİYOR MU?
        foreach (var dbName in dbCustomerNames)
        {
            var normalizedDb = CleanForComparison(dbName);
            if (string.IsNullOrEmpty(normalizedDb)) continue;

            if (normalizedExcel.Contains(normalizedDb) || normalizedDb.Contains(normalizedExcel))
            {
                return dbName;
            }
        }

        return null;
    }

    private string CleanForComparison(string input)
    {
        if (string.IsNullOrEmpty(input)) return "";

        // 1. Türkçe karakter hassasiyetiyle küçük harfe çevir
        string result = input.ToLower(new System.Globalization.CultureInfo("tr-TR"));

        // 2. Türkçe karakterleri normalize et
        result = result
            .Replace("ş", "s").Replace("ç", "c")
            .Replace("ı", "i").Replace("ü", "u")
            .Replace("ö", "o").Replace("ğ", "g")
            .Replace("İ", "i").Replace("I", "i");

        // 3. Boşlukları ve tüm noktalama işaretlerini kaldır (Sadece harf ve rakam kalsın)
        var charArray = result.Where(c => char.IsLetterOrDigit(c)).ToArray();
        return new string(charArray);
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
