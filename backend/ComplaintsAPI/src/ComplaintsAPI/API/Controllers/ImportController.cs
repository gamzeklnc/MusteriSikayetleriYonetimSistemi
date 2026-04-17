using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Infrastructure.Data;
using ComplaintsAPI.Domain.Entities;
using MiniExcelLibs;
using System.Globalization;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImportController : ControllerBase
{
    private readonly AppDbContext _context;

    public ImportController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("clear-database")]
    public async Task<IActionResult> ClearDatabase()
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.ComplaintBarcodeResults.ExecuteDeleteAsync();
            await _context.ComplaintDocuments.ExecuteDeleteAsync();
            await _context.ComplaintHistories.ExecuteDeleteAsync();
            await _context.UserActivityLogs.ExecuteDeleteAsync();
            await _context.ProductionCounts.ExecuteDeleteAsync();
            await _context.Complaints.ExecuteDeleteAsync();

            await transaction.CommitAsync();
            return Ok(new { Message = "Veritabanı başarıyla temizlendi." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Temizlik sırasında hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("reset-and-import")]
    public async Task<IActionResult> ResetAndImport(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Geçerli bir Excel dosyası yükleyin.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            Console.WriteLine($"\n---> IMPORT ASAMASI: {file.FileName}");

            // 1. Verileri Temizle
            await _context.ComplaintBarcodeResults.ExecuteDeleteAsync();
            await _context.ComplaintDocuments.ExecuteDeleteAsync();
            await _context.ComplaintHistories.ExecuteDeleteAsync();
            await _context.UserActivityLogs.ExecuteDeleteAsync();
            await _context.ProductionCounts.ExecuteDeleteAsync();
            await _context.Complaints.ExecuteDeleteAsync();
            Console.WriteLine("---> Mevcut veriler temizlendi.");

            // 2. Excel'i Oku - Başlıklar 2. satırda olduğu için useHeaderRow:false kullanıyoruz
            using var stream = file.OpenReadStream();
            // useHeaderRow:false => her satır A,B,C... kolonlu dict olarak gelir
            var rawRows = stream.Query(useHeaderRow: false).ToList();
            Console.WriteLine($"---> Toplam ham satir sayisi: {rawRows.Count}");

            if (rawRows.Count < 2)
            {
                Console.WriteLine("---> HATA: Excel dosyasında yeterli satır yok!");
                await transaction.RollbackAsync();
                return BadRequest("Excel dosyası boş veya çok az satır içeriyor.");
            }

            // 2. satır (index=1) başlık satırı - A, B, C... kolonlarını gerçek isimle eşle
            var headerRow = rawRows[1] as IDictionary<string, object>;
            if (headerRow == null)
            {
                Console.WriteLine("---> HATA: Başlık satırı okunamadı!");
                await transaction.RollbackAsync();
                return BadRequest("Excel başlık satırı okunamadı.");
            }

            // Kolon harfi -> gerçek başlık ismi haritası  (A -> "Şirket", B -> "Proje" gibi)
            var columnMap = new Dictionary<string, string>();
            foreach (var key in headerRow.Keys)
            {
                var headerValue = headerRow[key]?.ToString()?.Trim() ?? "";
                if (!string.IsNullOrEmpty(headerValue))
                    columnMap[key] = headerValue;
            }

            Console.WriteLine("---> Kolon Haritasi: " + string.Join(" | ", columnMap.Select(kv => $"{kv.Key}={kv.Value}")));

            var complaints = new List<Complaint>();
            int adminUserId = 1;

            // --- Tüm veri satırlarını önce bir listeye al ---
            var dataRows = new List<Dictionary<string, object>>();
            int rowNum = 0;
            int skippedCount = 0;

            foreach (var rawRow in rawRows.Skip(2))
            {
                rowNum++;
                var rawDict = rawRow as IDictionary<string, object>;
                if (rawDict == null) continue;

                // Kolon harflerini gerçek başlık isimlerine çevir
                var dict = new Dictionary<string, object>();
                foreach (var kv in rawDict)
                {
                    if (columnMap.TryGetValue(kv.Key, out var realName))
                        dict[realName] = kv.Value ?? "";
                }

                // Boş satırları atla
                string customerName = GetValue(dict, "Şirket", "Sirket", "Musteri", "Müşteri");
                if (string.IsNullOrWhiteSpace(customerName))
                {
                    skippedCount++;
                    if (skippedCount <= 3)
                        Console.WriteLine($"---> Satir {rowNum + 2} atlandi: 'Şirket' kolonu bos.");
                    continue;
                }

                dataRows.Add(dict);
            }

            Console.WriteLine($"---> Gecerli veri satiri: {dataRows.Count}, Atlanan: {skippedCount}");

            // --- Aynı 'No' değerine sahip satırları grupla ---
            // "No" kolonu eski sistemin şikayet numarasıdır.
            var grouped = dataRows
                .GroupBy(d => GetValue(d, "No", "no", "ŞikayetNo", "SikayetNo", "ID", "Id"))
                .ToList();

            Console.WriteLine($"---> Benzersiz sikayet sayisi (gruplama sonrasi): {grouped.Count}");

            foreach (var group in grouped)
            {
                var firstRow = group.First();
                string complaintNo = group.Key?.Trim() ?? "";

                // Tüm gruptaki barkodları birleştir
                var allBarcodes = group
                    .Select(d => GetValue(d, "KusurluPanelSeriNo", "SeriNo", "Barkod"))
                    .Where(b => !string.IsNullOrWhiteSpace(b))
                    .Distinct()
                    .ToList();
                string mergedBarcodes = string.Join(", ", allBarcodes);

                // Toplam kusurlu ürün miktarı
                int totalQty = group.Sum(d => ParseInt(GetValue(d, "KusurluÜrünMiktarı", "KusurluUrunMiktari", "Miktar")));

                var complaintDate = ParseDate(GetValue(firstRow, "ŞikayetTarihi", "SikayetTarihi", "Tarih"));

                var complaint = new Complaint
                {
                    CustomerName = GetValue(firstRow, "Şirket", "Sirket", "Musteri", "Müşteri"),
                    ProjectName = GetValue(firstRow, "Proje"),
                    ProjectLocation = GetValue(firstRow, "ProjeLokasyonu", "ProjeLokasyon"),
                    Brand = GetValue(firstRow, "ÜrünİSmi", "UrunIsmi", "UrunAdi", "Marka", "Brand"),
                    ComplaintDate = complaintDate,
                    Barcodes = mergedBarcodes,
                    ProductionDate = ParseDate(GetValue(firstRow, "ÜretimTarihi", "UretimTarihi")),
                    DefectiveQuantity = totalQty,
                    ErrorDefinition = GetValue(firstRow, "HATATANIMI", "Hata"),
                    StockCode = null,
                    SellerName = string.Empty,
                    InitialNote = string.Empty,
                    CreatedById = adminUserId,
                    Status = "Kapali/ZT",
                    RegistrationDate = complaintDate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CurrentDepartmentId = 2
                };

                // Barkodlardan HSA1/HSA2 say
                if (!string.IsNullOrEmpty(mergedBarcodes))
                {
                    var splitBarcodes = mergedBarcodes.Split(new[] { ',', ';', ' ', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
                    complaint.Hsa1 = splitBarcodes.Count(b => b.StartsWith("HSA1", StringComparison.OrdinalIgnoreCase));
                    complaint.Hsa2 = splitBarcodes.Count(b => b.StartsWith("HSA2", StringComparison.OrdinalIgnoreCase));
                }

                complaint.SetDerivedDateFields();

                // Şikayet No: Tarih yılı (YY) + Excel'deki No sütununun seri numarası
                // Örnek: 2024 tarihli ve No=5 olan kayıt → "24-005"
                string yearPart = complaintDate.ToString("yy");
                if (int.TryParse(complaintNo, out int serialNo))
                {
                    complaint.ComplaintNumber = $"{yearPart}-{serialNo:D3}";
                }
                else
                {
                    // No sayısal değilse olduğu gibi kullan (örn: "24-005" zaten formatlanmış)
                    complaint.ComplaintNumber = string.IsNullOrEmpty(complaintNo) ? $"{yearPart}-000" : complaintNo;
                }

                complaints.Add(complaint);
            }

            if (complaints.Any())
            {
                await _context.Complaints.AddRangeAsync(complaints);
                await _context.SaveChangesAsync();
                Console.WriteLine($"---> BASARILI: {complaints.Count} adet kayıt eklendi.");
                if (skippedCount > 0) Console.WriteLine($"---> NOT: {skippedCount} satir atlandi (Şirket adı bulunamadığı için).");
            }
            else
            {
                string columnDebug = rawRows.Any() ? string.Join(", ", (rawRows[1] as IDictionary<string, object>)?.Keys ?? new string[0]) : "Bos";
                Console.WriteLine("---> KRITIK: Hiç kayıt eklenemedi! Kolonlariniz eşleşmiyor olabilir.");
                Console.WriteLine("---> Mevcut Kolonlar: " + columnDebug);
            }

            await transaction.CommitAsync();
            return Ok(new { Message = $"{complaints.Count} adet kayıt başarıyla içe aktarıldı." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"---> HATA OLUSTU: {ex.Message}");
            return StatusCode(500, $"İşlem sırasında hata oluştu: {ex.Message}");
        }
    }

    private string GetValue(IDictionary<string, object> dict, params string[] names)
    {
        var normalizedNames = names.Select(n => NormalizeKey(n)).ToList();
        
        foreach (var key in dict.Keys)
        {
            if (normalizedNames.Contains(NormalizeKey(key)))
            {
                return dict[key]?.ToString()?.Trim() ?? "";
            }
        }
        return "";
    }

    private string NormalizeKey(string key)
    {
        if (string.IsNullOrEmpty(key)) return "";
        string normalized = key.ToLowerInvariant().Replace(" ", "").Trim();
        
        // Türkçe karakterleri temizle (Daha garanti eşleşme için)
        return normalized
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
        if (int.TryParse(value.ToString(), out var result)) return result;
        return 0;
    }
}
