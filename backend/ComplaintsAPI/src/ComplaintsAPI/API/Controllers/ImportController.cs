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
            await _context.ShipmentCounts.ExecuteDeleteAsync();
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

            // 1. Mevcut Şikayet Numaralarını Al (Eskileri silmiyoruz, sadece yenileri ekliyoruz)
            var existingComplaints = await _context.Complaints.ToDictionaryAsync(c => c.ComplaintNumber, StringComparer.OrdinalIgnoreCase);
            var existingSet = new HashSet<string>(existingComplaints.Keys, StringComparer.OrdinalIgnoreCase);
            
            Console.WriteLine($"---> {existingSet.Count} adet mevcut kayit bulundu, yeniler eklenecek.");

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
                    dict[kv.Key] = kv.Value ?? "";
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
                    ModulePower = GetValue(firstRow, "I", "Modül Gücü", "Modul Gucu", "Güç", "Guc", "Power"),
                    ComplaintDate = complaintDate,
                    Barcodes = mergedBarcodes,
                    ProductionDate = ParseDate(GetValue(firstRow, "ÜretimTarihi", "UretimTarihi")),
                    DefectiveQuantity = totalQty,
                    ErrorDefinition = NormalizeErrorDefinition(GetValue(firstRow, "HATATANIMI", "Hata")),
                    StockCode = null,
                    SellerName = string.Empty,
                    InitialNote = GetValue(firstRow, "ŞİKAYETAÇIKLAMASI", "SikayetAciklamasi", "ŞikayetNotu", "SikayetNotu", "ŞikayetNotları", "SikayetNotlari", "Not"),
                    CreatedById = adminUserId,
                    Status = "Kapali/ZT",
                    RegistrationDate = complaintDate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CurrentDepartmentId = 2,
                    BarcodeResults = new List<ComplaintBarcodeResult>()
                };
                MarkImportedComplaintWorkflowAsCompleted(complaint, adminUserId);

                int hsa1 = 0, hsa2 = 0;
                int jHsa1 = 0, jHsa2 = 0, jOther = 0;
                int uHsa1 = 0, uHsa2 = 0, uOther = 0;

                foreach (var row in group)
                {
                    int rowMiktar = ParseInt(GetValue(row, "KusurluÜrünMiktarı", "KusurluUrunMiktari", "Miktar"));
                    if (rowMiktar <= 0) rowMiktar = 1;

                    var barcode = GetValue(row, "KusurluPanelSeriNo", "SeriNo", "Barkod");
                    var factory = NormalizeKey(GetValue(row, "Fabrika", "FABRİKA", "FABRIKA"));
                    var decision = GetValue(row, "Haklı/Haksız", "Hakli/Haksiz", "Durum", "HAKLI/HAKSIZŞİKAYET", "HAKLI/HAKSIZSIKAYET");

                    // Barkod sütunu boş olsa bile miktar kadar fabrika üretimine ekle
                    if (IsHsa1Factory(factory)) hsa1 += rowMiktar;
                    else if (IsHsa2Factory(factory)) hsa2 += rowMiktar;

                    bool? isJustified = null;
                    if (IsCheckedDecision(decision))
                    {
                        isJustified = true;
                        if (IsHsa1Factory(factory)) jHsa1 += rowMiktar;
                        else if (IsHsa2Factory(factory)) jHsa2 += rowMiktar;
                        else jOther += rowMiktar;
                    }
                    else if (IsRejectedDecision(decision))
                    {
                        isJustified = false;
                        if (IsHsa1Factory(factory)) uHsa1 += rowMiktar;
                        else if (IsHsa2Factory(factory)) uHsa2 += rowMiktar;
                        else uOther += rowMiktar;
                    }

                    if (!string.IsNullOrWhiteSpace(barcode) && isJustified != null)
                    {
                        complaint.BarcodeResults.Add(new ComplaintBarcodeResult
                        {
                            Barcode = barcode.Trim(),
                            Factory = NormalizeFactoryLabel(factory),
                            IsJustified = isJustified
                        });
                    }
                }

                complaint.Hsa1 = hsa1;
                complaint.Hsa2 = hsa2;
                complaint.JustifiedHsa1Count = jHsa1;
                complaint.JustifiedHsa2Count = jHsa2;
                complaint.JustifiedOtherCount = jOther;
                complaint.UnjustifiedHsa1Count = uHsa1;
                complaint.UnjustifiedHsa2Count = uHsa2;
                complaint.UnjustifiedOtherCount = uOther;

                if (jHsa1 > 0 || jHsa2 > 0 || jOther > 0) complaint.IsValidComplaint = true;
                else if (uHsa1 > 0 || uHsa2 > 0 || uOther > 0) complaint.IsValidComplaint = false;

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

                // Zaten bu numaraya sahip bir şikayet varsa atla
                if (existingSet.Contains(complaint.ComplaintNumber))
                {
                    if (existingComplaints.TryGetValue(complaint.ComplaintNumber, out var existingComplaint))
                        MarkImportedComplaintWorkflowAsCompleted(existingComplaint, adminUserId);

                    Console.WriteLine($"---> Atlandi (Zaten var): {complaint.ComplaintNumber}");
                    continue;
                }

                existingSet.Add(complaint.ComplaintNumber);
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

            if (_context.ChangeTracker.HasChanges())
                await _context.SaveChangesAsync();

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

    [HttpPost("import-type2")]
    public async Task<IActionResult> ImportType2(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Geçerli bir Excel dosyası yükleyin.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            Console.WriteLine($"\n---> TYPE-2 IMPORT ASAMASI: {file.FileName}");

            var existingComplaints = await _context.Complaints.ToDictionaryAsync(c => c.ComplaintNumber, StringComparer.OrdinalIgnoreCase);
            var existingSet = new HashSet<string>(existingComplaints.Keys, StringComparer.OrdinalIgnoreCase);

            using var stream = file.OpenReadStream();
            var sheetNames = MiniExcel.GetSheetNames(stream);

            bool isMultiSheetFormat = sheetNames.Any(s => s.Equals("GENEL LİSTE", StringComparison.OrdinalIgnoreCase)) &&
                                      sheetNames.Any(s => s.Equals("BARKODLAR", StringComparison.OrdinalIgnoreCase));

            if (isMultiSheetFormat)
            {
                Console.WriteLine("---> ÇOK SAYFALI FORMAT ALGILANDI");
                var complaints = new List<Complaint>();
                int adminUserId = 1;

                var genelListeRaw = stream.Query(useHeaderRow: false, sheetName: "GENEL LİSTE").ToList();
                var barkodlarRaw = stream.Query(useHeaderRow: false, sheetName: "BARKODLAR").ToList();

                if (genelListeRaw.Count < 2) return BadRequest("GENEL LİSTE sayfası boş.");
                
                var headerGenel = genelListeRaw[0] as IDictionary<string, object>;
                var headerBarkodlar = barkodlarRaw.Count > 0 ? barkodlarRaw[0] as IDictionary<string, object> : null;

                var colMapGenel = BuildColumnMap(headerGenel);
                var colMapBarkodlar = BuildColumnMap(headerBarkodlar);

                // Gruplama - Barkodlar
                var barkodGroups = barkodlarRaw.Skip(1)
                    .Select(r => r as IDictionary<string, object>)
                    .Where(r => r != null)
                    .Select(r => MapDict(r, colMapBarkodlar))
                    .Where(d => !string.IsNullOrWhiteSpace(GetValue(d, "NO")))
                    .GroupBy(d => GetValue(d, "NO"))
                    .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

                foreach (var rawRow in genelListeRaw.Skip(1))
                {
                    var dict = MapDict(rawRow as IDictionary<string, object>, colMapGenel);
                    string rowNoRaw = GetValue(dict, "NO");
                    
                    if (string.IsNullOrWhiteSpace(rowNoRaw) || rowNoRaw.Equals("NO", StringComparison.OrdinalIgnoreCase)) continue;

                    string generatedComplaintNum = rowNoRaw.Trim();
                    if (generatedComplaintNum.Length >= 3 && !generatedComplaintNum.Contains("-"))
                        generatedComplaintNum = generatedComplaintNum.Substring(0, 2) + "-" + generatedComplaintNum.Substring(2);

                    if (existingSet.Contains(generatedComplaintNum))
                    {
                        if (existingComplaints.TryGetValue(generatedComplaintNum, out var existingComplaint))
                        {
                            MarkImportedComplaintWorkflowAsCompleted(existingComplaint, adminUserId);
                            await _context.SaveChangesAsync();
                        }

                        Console.WriteLine($"---> Atlandi (Zaten var): {generatedComplaintNum}");
                        continue;
                    }

                    var complaintDateStr = GetValue(dict, "ŞİKAYETTARİHİ", "SIKAYETTARIHI", "TARİH");
                    var complaintDate = ParseDate(complaintDateStr);

                    string yearStr = GetValue(dict, "ŞİKAYETYIL", "SIKAYETYIL");
                    string monthStr = GetValue(dict, "ŞİKAYETAY", "SIKAYETAY");
                    if (complaintDate.Date == DateTime.UtcNow.Date && !string.IsNullOrEmpty(yearStr) && !string.IsNullOrEmpty(monthStr))
                    {
                        if (int.TryParse(yearStr, out int y) && int.TryParse(monthStr, out int m))
                            complaintDate = new DateTime(y, m, 1);
                    }

                    var complaint = new Complaint
                    {
                        ComplaintNumber = generatedComplaintNum,
                        CustomerName = GetValue(dict, "ŞİRKET", "SIRKET", "MÜŞTERİ") == "" ? "Bilinmiyor" : GetValue(dict, "ŞİRKET", "SIRKET", "MÜŞTERİ"),
                        ProjectName = GetValue(dict, "PROJE") == "" ? "-" : GetValue(dict, "PROJE"),
                        ProjectLocation = GetValue(dict, "PROJELOKASYONU", "PROJELOKASYON") == "" ? "-" : GetValue(dict, "PROJELOKASYONU", "PROJELOKASYON"),
                        Brand = GetValue(dict, "MARKA", "ÜRÜNİSMİ", "URUNISMI", "URUNADI"),
                        ComplaintDate = complaintDate,
                        ProductionDate = complaintDate,
                        DefectiveQuantity = ParseInt(GetValue(dict, "KUSURLUÜRÜNMİKTARI", "KUSURLUURUNMIKTARI", "KUSURLUMİKTAR")),
                        ErrorDefinition = NormalizeErrorDefinition(GetValue(dict, "HATATANIMI(ÖZET)", "HATATANIMI", "HATA")),
                        InitialNote = GetValue(dict, "ŞİKAYETNOTLARI", "SIKAYETNOTLARI", "NOT", "ŞİKAYETNOTU"),
                        CreatedById = adminUserId,
                        Status = "Kapali/ZT",
                        RegistrationDate = complaintDate,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CurrentDepartmentId = 2,
                        BarcodeResults = new List<ComplaintBarcodeResult>()
                    };
                    MarkImportedComplaintWorkflowAsCompleted(complaint, adminUserId);

                    complaint.SetDerivedDateFields();

                    if (string.IsNullOrWhiteSpace(complaint.CustomerName)) complaint.CustomerName = "Bilinmiyor";
                    if (string.IsNullOrWhiteSpace(complaint.ProjectName)) complaint.ProjectName = "-";

                    int jHsa1 = 0, jHsa2 = 0, jOther = 0;
                    int uHsa1 = 0, uHsa2 = 0, uOther = 0;
                    int hsa1 = 0, hsa2 = 0;
                    var barcodeStrings = new List<string>();

                    if (barkodGroups.TryGetValue(rowNoRaw.Trim(), out var barcodeRows))
                    {
                        foreach (var br in barcodeRows)
                        {
                            var barcodeVal = GetValue(br, "MODÜLSERİNO", "MODULSERINO", "SERİNO", "SERINO");
                            if (string.IsNullOrWhiteSpace(barcodeVal)) continue;

                            barcodeStrings.Add(barcodeVal);

                            var fabrika = NormalizeKey(GetValue(br, "FABRİKA", "FABRIKA"));
                            var durum = GetValue(br, "HAKLI/HAKSIZŞİKAYET", "HAKLI/HAKSIZSIKAYET", "DURUM").ToLowerInvariant();
                            
                            int miktar = ParseInt(GetValue(br, "KUSURLUÜRÜNMİKTARI", "KUSURLUURUNMIKTARI", "KUSURLUMİKTAR"));
                            if (miktar <= 0) miktar = 1;

                            bool? isJustified = null;

                            if (durum.Contains("hakli") || durum.Contains("haklı"))
                            {
                                isJustified = true;
                                if (IsHsa1Factory(fabrika)) jHsa1 += miktar;
                                else if (IsHsa2Factory(fabrika)) jHsa2 += miktar;
                                else jOther += miktar;
                            }
                            else if (durum.Contains("haksiz") || durum.Contains("haksız"))
                            {
                                isJustified = false;
                                if (IsHsa1Factory(fabrika)) uHsa1 += miktar;
                                else if (IsHsa2Factory(fabrika)) uHsa2 += miktar;
                                else uOther += miktar;
                            }

                            if (IsHsa1Factory(fabrika)) hsa1 += miktar;
                            else if (IsHsa2Factory(fabrika)) hsa2 += miktar;

                            complaint.BarcodeResults.Add(new ComplaintBarcodeResult
                            {
                                Barcode = barcodeVal,
                                Factory = NormalizeFactoryLabel(fabrika),
                                IsJustified = isJustified
                            });
                        }
                    }

                    complaint.Barcodes = string.Join(", ", barcodeStrings.Distinct());
                    complaint.Hsa1 = hsa1;
                    complaint.Hsa2 = hsa2;
                    complaint.JustifiedHsa1Count = jHsa1;
                    complaint.JustifiedHsa2Count = jHsa2;
                    complaint.JustifiedOtherCount = jOther;
                    complaint.UnjustifiedHsa1Count = uHsa1;
                    complaint.UnjustifiedHsa2Count = uHsa2;
                    complaint.UnjustifiedOtherCount = uOther;

                    if (jHsa1 > 0 || jHsa2 > 0 || jOther > 0) complaint.IsValidComplaint = true;
                    else if (uHsa1 > 0 || uHsa2 > 0 || uOther > 0) complaint.IsValidComplaint = false;

                    existingSet.Add(generatedComplaintNum);
                    complaints.Add(complaint);
                }

                if (complaints.Any())
                {
                    await _context.Complaints.AddRangeAsync(complaints);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"---> TYPE-2 (MULTI-SHEET) BASARILI: {complaints.Count} adet kayıt eklendi.");
                }

                await transaction.CommitAsync();
                return Ok(new { Message = $"{complaints.Count} adet Tip-2 kayıt (Çoklu Sayfa formatı) başarıyla içe aktarıldı." });
            }

            // --- TEK SAYFALI ESKİ FORMAT ---
            Console.WriteLine("---> TEK SAYFALI FORMAT ALGILANDI (ESKİ)");
            var rawRows = stream.Query(useHeaderRow: false).ToList();

            if (rawRows.Count < 2)
            {
                await transaction.RollbackAsync();
                return BadRequest("Excel dosyası boş veya çok az satır içeriyor.");
            }

            IDictionary<string, object> headerRow = null;
            int headerIndex = 0;
            for (int i = 0; i < Math.Min(5, rawRows.Count); i++)
            {
                var r = rawRows[i] as IDictionary<string, object>;
                if (r != null && r.Values.Any(v => NormalizeKey(v?.ToString()).Equals("no", StringComparison.OrdinalIgnoreCase)))
                {
                    headerRow = r;
                    headerIndex = i;
                    break;
                }
            }

            if (headerRow == null)
            {
                await transaction.RollbackAsync();
                return BadRequest("Excel başlık satırı (içinde 'NO' olan) okunamadı.");
            }

            var columnMap = new Dictionary<string, string>();
            foreach (var key in headerRow.Keys)
            {
                var headerValue = headerRow[key]?.ToString()?.Trim() ?? "";
                if (!string.IsNullOrEmpty(headerValue))
                    columnMap[key] = headerValue;
            }

            var fallbackComplaints = new List<Complaint>();
            int fallbackAdminUserId = 1;
            var dataRows = new List<Dictionary<string, object>>();

            foreach (var rawRow in rawRows.Skip(headerIndex + 1)) // Skip until we are past header. 
            {
                var rawDict = rawRow as IDictionary<string, object>;
                if (rawDict == null) continue;

                var dict = new Dictionary<string, object>();
                foreach (var kv in rawDict)
                {
                    if (columnMap.TryGetValue(kv.Key, out var realName))
                        dict[realName] = kv.Value ?? "";
                }

                string rowNo = GetValue(dict, "NO");
                if (string.IsNullOrWhiteSpace(rowNo) || rowNo.Equals("NO", StringComparison.OrdinalIgnoreCase))
                    continue;

                dataRows.Add(dict);
            }

            var grouped = dataRows.GroupBy(d => GetValue(d, "NO")).ToList();

            foreach (var group in grouped)
            {
                var firstRow = group.First();
                string complaintNoRaw = group.Key?.Trim() ?? "";
                
                string generatedComplaintNum = complaintNoRaw;
                if (complaintNoRaw.Length >= 3)
                {
                    generatedComplaintNum = complaintNoRaw.Substring(0, 2) + "-" + complaintNoRaw.Substring(2);
                }

                if (existingSet.Contains(generatedComplaintNum))
                {
                    if (existingComplaints.TryGetValue(generatedComplaintNum, out var existingComplaint))
                    {
                        MarkImportedComplaintWorkflowAsCompleted(existingComplaint, fallbackAdminUserId);
                        await _context.SaveChangesAsync();
                    }

                    Console.WriteLine($"---> Atlandi (Zaten var): {generatedComplaintNum}");
                    continue;
                }

                var allBarcodes = group
                    .Select(d => GetValue(d, "MODÜLSERİNO", "MODULSERINO", "SERİNO", "SERINO"))
                    .Where(b => !string.IsNullOrWhiteSpace(b))
                    .Distinct()
                    .ToList();
                string mergedBarcodes = string.Join(", ", allBarcodes);

                int totalQty = group.Sum(d => ParseInt(GetValue(d, "KUSURLUÜRÜNMİKTARI", "KUSURLUURUNMIKTARI", "KUSURLUMİKTAR")));

                int hsa1 = 0;
                int hsa2 = 0;
                foreach (var row in group)
                {
                    int miktar = ParseInt(GetValue(row, "KUSURLUÜRÜNMİKTARI", "KUSURLUURUNMIKTARI", "KUSURLUMİKTAR"));
                    string fabrika = NormalizeKey(GetValue(row, "FABRİKA", "FABRIKA"));

                    if (IsHsa1Factory(fabrika))
                        hsa1 += miktar;
                    else if (IsHsa2Factory(fabrika))
                        hsa2 += miktar;
                }

                var complaintDateStr = GetValue(firstRow, "ŞİKAYETTARİHİ", "SIKAYETTARIHI", "TARİH");
                var complaintDate = ParseDate(complaintDateStr);
                
                // Extra failsafe for year parsing from 'ŞİKAYET YIL'
                string yearStr = GetValue(firstRow, "ŞİKAYETYIL", "SIKAYETYIL");
                string monthStr = GetValue(firstRow, "ŞİKAYETAY", "SIKAYETAY");
                if (complaintDate.Date == DateTime.UtcNow.Date && !string.IsNullOrEmpty(yearStr) && !string.IsNullOrEmpty(monthStr))
                {
                    if (int.TryParse(yearStr, out int y) && int.TryParse(monthStr, out int m))
                        complaintDate = new DateTime(y, m, 1);
                }

                var complaint = new Complaint
                {
                    ComplaintNumber = generatedComplaintNum,
                    CustomerName = GetValue(firstRow, "ŞİRKET", "SIRKET", "MÜŞTERİ") == "" ? "Bilinmiyor" : GetValue(firstRow, "ŞİRKET", "SIRKET", "MÜŞTERİ"),
                    ProjectName = GetValue(firstRow, "PROJE") == "" ? "-" : GetValue(firstRow, "PROJE"),
                    ProjectLocation = GetValue(firstRow, "PROJELOKASYONU", "PROJELOKASYON") == "" ? "-" : GetValue(firstRow, "PROJELOKASYONU", "PROJELOKASYON"),
                    Brand = GetValue(firstRow, "MARKA", "ÜRÜNİSMİ", "URUNISMI", "URUNADI"),
                    ComplaintDate = complaintDate,
                    Barcodes = mergedBarcodes,
                    ProductionDate = complaintDate, // Placeholder since Type-2 doesn't specify Production Date explicitly
                    DefectiveQuantity = totalQty,
                    ErrorDefinition = NormalizeErrorDefinition(GetValue(firstRow, "HATATANIMI(ÖZET)", "HATATANIMI", "HATA")),
                    InitialNote = GetValue(firstRow, "ŞİKAYETNOTLARI", "SIKAYETNOTLARI", "NOT", "ŞİKAYETNOTU"),
                    CreatedById = fallbackAdminUserId,
                    Status = "Kapali/ZT",
                    RegistrationDate = complaintDate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CurrentDepartmentId = 2,
                    Hsa1 = hsa1,
                    Hsa2 = hsa2
                };
                MarkImportedComplaintWorkflowAsCompleted(complaint, fallbackAdminUserId);
                
                complaint.SetDerivedDateFields();

                if (string.IsNullOrWhiteSpace(complaint.CustomerName)) complaint.CustomerName = "Bilinmiyor";
                if (string.IsNullOrWhiteSpace(complaint.ProjectName)) complaint.ProjectName = "-";

                existingSet.Add(generatedComplaintNum);
                fallbackComplaints.Add(complaint);
            }

            if (fallbackComplaints.Any())
            {
                await _context.Complaints.AddRangeAsync(fallbackComplaints);
                await _context.SaveChangesAsync();
                Console.WriteLine($"---> TYPE-2 BASARILI: {fallbackComplaints.Count} adet kayıt eklendi.");
            }

            await transaction.CommitAsync();
            return Ok(new { Message = $"{fallbackComplaints.Count} adet Tip-2 kayıt başarıyla içe aktarıldı." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"---> TYPE-2 HATA OLUSTU: {ex.Message}");
            return StatusCode(500, $"İşlem sırasında hata oluştu: {ex.Message}");
        }
    }

    private Dictionary<string, string> BuildColumnMap(IDictionary<string, object>? headerRow)
    {
        var map = new Dictionary<string, string>();
        if (headerRow == null) return map;
        foreach (var key in headerRow.Keys)
        {
            var headerValue = headerRow[key]?.ToString()?.Trim() ?? "";
            if (!string.IsNullOrEmpty(headerValue)) map[key] = headerValue;
        }
        return map;
    }

    private Dictionary<string, object> MapDict(IDictionary<string, object>? rawDict, Dictionary<string, string> colMap)
    {
        var dict = new Dictionary<string, object>();
        if (rawDict == null) return dict;
        foreach (var kv in rawDict)
        {
            if (colMap.TryGetValue(kv.Key, out var realName))
                dict[realName] = kv.Value ?? "";
        }
        return dict;
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

    private static void MarkImportedComplaintWorkflowAsCompleted(Complaint complaint, int systemUserId)
    {
        complaint.IsQualityReported = true;
        complaint.QualityReportNote ??= "Excel import ile kalite raporu tamamlandi.";
        complaint.QualityReportedById ??= systemUserId;
        complaint.Has8DReport = true;

        complaint.IsManagementApproved = true;
        complaint.ManagementApprovalNote ??= "Excel import ile yonetim onayi tamamlandi.";
        complaint.ManagementApprovedById ??= systemUserId;
    }

    private string NormalizeKey(string key)
    {
        if (string.IsNullOrEmpty(key)) return "";
        string normalized = key.ToLowerInvariant().Replace(" ", "").Trim();
        
        // Türkçe karakterleri temizle (Daha garanti eşleşme için)
        return normalized
            .Replace("\u015f", "s").Replace("\u00e7", "c")
            .Replace("\u0131", "i").Replace("\u00fc", "u")
            .Replace("\u00f6", "o").Replace("\u011f", "g")
            .Replace("ş", "s").Replace("ç", "c")
            .Replace("ı", "i").Replace("ü", "u")
            .Replace("ö", "o").Replace("ğ", "g");
    }

    private static bool IsCommonFactory(string factory)
    {
        return factory.Contains("1&2") || factory.Contains("1/2") || factory.Contains("ortak");
    }

    private static bool IsHsa1Factory(string factory)
    {
        return !IsCommonFactory(factory) && (factory.Contains("hsa1") || factory.Contains("hsa-1"));
    }

    private static bool IsHsa2Factory(string factory)
    {
        return !IsCommonFactory(factory) && (factory.Contains("hsa2") || factory.Contains("hsa-2"));
    }

    private static string? NormalizeFactoryLabel(string factory)
    {
        if (string.IsNullOrWhiteSpace(factory)) return null;
        if (IsCommonFactory(factory)) return "1&2";
        if (IsHsa1Factory(factory)) return "HSA-1";
        if (IsHsa2Factory(factory)) return "HSA-2";
        return factory.Trim();
    }

    private static bool IsCheckedDecision(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var normalized = value.Trim().ToLowerInvariant();
        return normalized.Contains("✓")
            || normalized.Contains("✔")
            || normalized.Contains("√")
            || normalized.Equals("true")
            || normalized.Equals("evet")
            || normalized.Equals("hakli")
            || normalized.Equals("haklı");
    }

    private static bool IsRejectedDecision(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var normalized = value.Trim().ToLowerInvariant();
        return normalized.Equals("x")
            || normalized.Contains("✗")
            || normalized.Contains("✘")
            || normalized.Equals("false")
            || normalized.Equals("hayir")
            || normalized.Equals("hayır")
            || normalized.Equals("haksiz")
            || normalized.Equals("haksız");
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

    [HttpPost("import-type3")]
    public async Task<IActionResult> ImportType3(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Geçerli bir Excel dosyası yükleyin.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            Console.WriteLine($"\n---> TYPE-3 IMPORT ASAMASI: {file.FileName}");

            using var stream = file.OpenReadStream();
            // 2. satırdan okumaya başlayacağımız için useHeaderRow false
            var rawRows = stream.Query(useHeaderRow: false).ToList();

            if (rawRows.Count < 2)
            {
                await transaction.RollbackAsync();
                return BadRequest("Excel dosyası boş veya çok az satır içeriyor.");
            }

            // Sütunlar:
            // A sütunu: Şikayet Numarası (Örn: 2504 -> 25-04)
            // E sütunu: Barkodlar ("AAAA" ise yoksayılacak)
            // O sütunu: Haklı/Haksız durumu

            var allComplaints = await _context.Complaints.ToListAsync();
            var complaintDict = allComplaints.ToDictionary(c => c.ComplaintNumber, c => c, StringComparer.OrdinalIgnoreCase);

            int updatedCount = 0;
            int skippedCount = 0;

            // 2. satır index 1'e denk gelir. Buradan itibaren verileri alıyoruz.
            var groupedRows = rawRows.Skip(1)
                .Select(r => r as IDictionary<string, object>)
                .Where(r => r != null && r.ContainsKey("A") && r["A"] != null && !string.IsNullOrWhiteSpace(r["A"].ToString()))
                .GroupBy(r => r["A"].ToString()!.Trim())
                .ToList();

            foreach (var group in groupedRows)
            {
                string rawNumber = group.Key;
                string complaintNumber = rawNumber;
                
                // Eğer içinde tire yoksa ve en az 3 haneliyse (örn 2504) tire ekle: 25-04
                if (rawNumber.Length >= 3 && !rawNumber.Contains("-"))
                {
                    complaintNumber = rawNumber.Substring(0, 2) + "-" + rawNumber.Substring(2);
                }

                if (!complaintDict.TryGetValue(complaintNumber, out var complaint))
                {
                    skippedCount++;
                    continue;
                }

                // Barkodları birleştir (Mevcut olanları mükerrer yazmamak için hashset veya liste ile kontrol ediyoruz)
                var existingBarcodes = complaint.Barcodes?
                    .Split(new[] { ',', ';', ' ', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(b => b.Trim())
                    .ToList() ?? new List<string>();

                var newBarcodes = group
                    .Where(r => r.ContainsKey("E") && r["E"] != null)
                    .Select(r => r["E"].ToString()!.Trim())
                    .Where(b => !string.IsNullOrWhiteSpace(b) && !b.Equals("AAAA", StringComparison.OrdinalIgnoreCase))
                    .ToList();
                var hasBarcodeInImport = newBarcodes.Any();

                foreach(var nb in newBarcodes)
                {
                    if (!existingBarcodes.Contains(nb, StringComparer.OrdinalIgnoreCase))
                    {
                        existingBarcodes.Add(nb);
                    }
                }

                complaint.Barcodes = string.Join(", ", existingBarcodes.Distinct());

                // Barkodlardan HSA1 / HSA2 sayılarını da güncelleyelim
                if (hasBarcodeInImport)
                {
                    complaint.Hsa1 = group.Count(row =>
                    {
                        var barcode = row.ContainsKey("E") ? row["E"]?.ToString()?.Trim() : null;
                        var factory = row.ContainsKey("G") ? NormalizeKey(row["G"]?.ToString() ?? "") : "";
                        return !string.IsNullOrWhiteSpace(barcode)
                            && !barcode.Equals("AAAA", StringComparison.OrdinalIgnoreCase)
                            && IsHsa1Factory(factory);
                    });
                    complaint.Hsa2 = group.Count(row =>
                    {
                        var barcode = row.ContainsKey("E") ? row["E"]?.ToString()?.Trim() : null;
                        var factory = row.ContainsKey("G") ? NormalizeKey(row["G"]?.ToString() ?? "") : "";
                        return !string.IsNullOrWhiteSpace(barcode)
                            && !barcode.Equals("AAAA", StringComparison.OrdinalIgnoreCase)
                            && IsHsa2Factory(factory);
                    });
                }

                // Haklı/Haksız durumu ve Sayıların Belirlenmesi
                int jHsa1 = 0, jHsa2 = 0, jOther = 0;
                int uHsa1 = 0, uHsa2 = 0, uOther = 0;
                var barcodeDecisions = new Dictionary<string, (bool? IsJustified, string? Factory)>(StringComparer.OrdinalIgnoreCase);

                foreach (var row in group)
                {
                    // G Sütunu: Fabrika (HSA-1 veya HSA-2)
                    string fabrika = "";
                    if (row.ContainsKey("G") && row["G"] != null)
                    {
                        fabrika = NormalizeKey(row["G"].ToString());
                    }

                    // O Sütunu: Durum (Haklı, Haksız, Devam Ediyor)
                    string durum = "";
                    if (row.ContainsKey("O") && row["O"] != null)
                    {
                        durum = NormalizeKey(row["O"].ToString());
                    }

                    bool? isJustified = null;
                    if (durum.Contains("hakli"))
                    {
                        isJustified = true;
                        if (!hasBarcodeInImport) jOther++;
                        else if (IsHsa1Factory(fabrika)) jHsa1++;
                        else if (IsHsa2Factory(fabrika)) jHsa2++;
                        else jOther++;
                    }
                    else if (durum.Contains("haksiz"))
                    {
                        isJustified = false;
                        if (!hasBarcodeInImport) uOther++;
                        else if (IsHsa1Factory(fabrika)) uHsa1++;
                        else if (IsHsa2Factory(fabrika)) uHsa2++;
                        else uOther++;
                    }
                    // "devam ediyor" vb. ise sayaca ekleme (atla)

                    if (row.ContainsKey("E") && row["E"] != null)
                    {
                        var rowBarcode = row["E"].ToString()?.Trim();
                        if (!string.IsNullOrWhiteSpace(rowBarcode) && !rowBarcode.Equals("AAAA", StringComparison.OrdinalIgnoreCase))
                        {
                            barcodeDecisions[rowBarcode] = (isJustified, NormalizeFactoryLabel(fabrika));
                        }
                    }
                }

                var existingResults = await _context.ComplaintBarcodeResults
                    .Where(br => br.ComplaintId == complaint.Id)
                    .ToListAsync();

                foreach (var decision in barcodeDecisions)
                {
                    var existingResult = existingResults.FirstOrDefault(br =>
                        br.Barcode.Equals(decision.Key, StringComparison.OrdinalIgnoreCase));

                    if (decision.Value.IsJustified == null)
                    {
                        if (existingResult != null)
                        {
                            _context.ComplaintBarcodeResults.Remove(existingResult);
                        }
                        continue;
                    }

                    if (existingResult != null)
                    {
                        existingResult.IsJustified = decision.Value.IsJustified;
                        existingResult.Factory = decision.Value.Factory;
                    }
                    else
                    {
                        _context.ComplaintBarcodeResults.Add(new ComplaintBarcodeResult
                        {
                            ComplaintId = complaint.Id,
                            Barcode = decision.Key,
                            Factory = decision.Value.Factory,
                            IsJustified = decision.Value.IsJustified
                        });
                    }
                }

                // Sayıları şikayete yaz (Eski sayıların üzerine yazarız ki güncel olsun)
                complaint.JustifiedHsa1Count = jHsa1;
                complaint.JustifiedHsa2Count = jHsa2;
                complaint.JustifiedOtherCount = jOther;

                complaint.UnjustifiedHsa1Count = uHsa1;
                complaint.UnjustifiedHsa2Count = uHsa2;
                complaint.UnjustifiedOtherCount = uOther;

                // Genel durum (IsValidComplaint): Eğer en az 1 haklı varsa true, hiç haklı yok ama haksız varsa false
                if (jHsa1 > 0 || jHsa2 > 0 || jOther > 0)
                {
                    complaint.IsValidComplaint = true;
                }
                else if (uHsa1 > 0 || uHsa2 > 0 || uOther > 0)
                {
                    complaint.IsValidComplaint = false;
                }

                complaint.UpdatedAt = DateTime.UtcNow;
                MarkImportedComplaintWorkflowAsCompleted(complaint, 1);
                updatedCount++;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { Message = $"{updatedCount} adet şikayetin barkod ve haklı/haksız bilgileri başarıyla güncellendi. (Sistemde bulunamayan {skippedCount} numara atlandı.)" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"---> TYPE-3 HATA OLUSTU: {ex.Message}");
            return StatusCode(500, $"İşlem sırasında hata oluştu: {ex.Message}");
        }
    }

    /// <summary>
    /// Hata tanımı string'ini normalize eder.
    /// Excel'den gelen "DiyotHatası", "Diyot Hatası", "DİYOT HATASI" gibi farklı yazımları
    /// tek bir standart formata dönüştürür.
    /// </summary>
    private static string NormalizeErrorDefinition(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "";

        // Trim ve fazla boşlukları temizle
        var input = System.Text.RegularExpressions.Regex.Replace(raw.Trim(), @"\s+", " ");

        // Karşılaştırma için tüm ayırıcıları sil
        string stripped = input
            .Replace(" ", "")
            .Replace("-", "")
            .Replace("/", "")
            .Replace(".", "")
            .Replace("(", "")
            .Replace(")", "")
            .Replace("_", "");

        // Önce Türkçe büyük harfleri küçüğe çevir (ToLowerInvariant İ→i̇ bug'ını önlemek için)
        stripped = stripped
            .Replace("İ", "i").Replace("I", "i")
            .Replace("Ş", "s").Replace("Ç", "c")
            .Replace("Ü", "u").Replace("Ö", "o")
            .Replace("Ğ", "g")
            .Replace("\u0130", "i")  // İ (capital I with dot)
            .ToLowerInvariant();

        // Türkçe küçük harfleri ASCII'ye çevir
        stripped = stripped
            .Replace("ş", "s").Replace("ç", "c")
            .Replace("ı", "i").Replace("ü", "u")
            .Replace("ö", "o").Replace("ğ", "g")
            .Replace("\u015f", "s").Replace("\u00e7", "c")
            .Replace("\u0131", "i").Replace("\u00fc", "u")
            .Replace("\u00f6", "o").Replace("\u011f", "g")
            .Replace("i\u0307", "i");  // combining dot above (İ → i̇ artifact)

        // Bilinen hata tanımı eşleştirme tablosu
        var knownErrors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // Diyot
            { "diyothatasi", "Diyot Hatası" },
            { "diyot", "Diyot Hatası" },

            // Kırık / Cam
            { "kirik", "Kırık" },
            { "kirikcam", "Kırık Cam" },
            { "kirikkacak", "Kırık/Kaçak" },
            { "kacak", "Kaçak" },
            { "camkirilmasi", "Cam Kırılması" },

            // Filike
            { "filikehatasi", "Filike Hatası" },
            { "filekehatasi", "Filike Hatası" },
            { "filtkehatasi", "Filike Hatası" },
            { "filike", "Filike Hatası" },

            // Hot Spot
            { "hotspot", "Hot Spot" },
            { "hotspothatasi", "Hot Spot" },

            // Çerçeve
            { "cercevedeformasyonu", "Çerçeve Deformasyonu" },
            { "cercevehatasi", "Çerçeve Hatası" },
            { "cerceve", "Çerçeve Deformasyonu" },

            // Junction Box / JB Lehim
            { "junctionboxhatasi", "Junction Box Hatası" },
            { "junctionbox", "Junction Box Hatası" },
            { "jbhatasi", "Junction Box Hatası" },
            { "jboxhatasi", "Junction Box Hatası" },
            { "jblehimhatasi", "JB Lehim Hatası" },
            { "jblehim", "JB Lehim Hatası" },
            { "junctionboxlehimhatasi", "JB Lehim Hatası" },
            { "junctionboxlehim", "JB Lehim Hatası" },

            // Backsheet
            { "backsheethatasi", "Backsheet Hatası" },
            { "backsheet", "Backsheet Hatası" },

            // P Sınıf
            { "psinifkartlielek", "P Sınıf Kartlı ile Sevk" },
            { "psinifkartlilesevk", "P Sınıf Kartlı ile Sevk" },
            { "psinifkartliilsevk", "P Sınıf Kartlı ile Sevk" },
            { "psinifkartlilesek", "P Sınıf Kartlı ile Sevk" },
            { "psinifkartliilesvk", "P Sınıf Kartlı ile Sevk" },
            { "psinifkartliilesevk", "P Sınıf Kartlı ile Sevk" },

            // Sararma
            { "sararmaguclenmishatasi", "Sararma" },
            { "sararma", "Sararma" },

            // Delaminasyon
            { "delaminasyon", "Delaminasyon" },

            // Micro Crack
            { "microcrack", "Micro Crack" },
            { "mikrocatlak", "Micro Crack" },

            // Snail Track
            { "snailtrack", "Snail Track" },
            { "snailtrail", "Snail Track" },

            // Solma
            { "solmarenk", "Solma/Renk" },
            { "solma", "Solma" },

            // PID
            { "pid", "PID" },
            { "pidhatasi", "PID Hatası" },

            // Güç Kaybı
            { "guckaybikontrol", "Güç Kaybı/Kontrol" },
            { "guckaybi", "Güç Kaybı" },
            { "guckaybikontrolverim", "Güç Kaybı/Kontrol" },

            // Performans
            { "performansdusuklugu", "Performans Düşüklüğü" },
            { "performansdusulugu", "Performans Düşüklüğü" },

            // EVA
            { "evahatasi", "EVA Hatası" },
            { "eva", "EVA Hatası" },

            // Laminasyon
            { "laminasyonhatasi", "Laminasyon Hatası" },
            { "laminasyon", "Laminasyon Hatası" },

            // Cell
            { "cellyapistirmasi", "Cell Yapıştırması" },
            { "cellyapistirmahatasi", "Cell Yapıştırması" },
            { "cellhatasi", "Cell Hatası" },

            // Ribbon
            { "ribbonhatasi", "Ribbon Hatası" },
            { "ribbon", "Ribbon Hatası" },

            // Çatırtılı
            { "catirtili", "Çatırtılı" },
            { "catirtilimodul", "Çatırtılı Modül" },

            // Etiket
            { "etikethatasi", "Etiket Hatası" },
            { "etiket", "Etiket Hatası" },

            // Konnektör
            { "konektorhatasi", "Konnektör Hatası" },
            { "konnektorhatasi", "Konnektör Hatası" },
            { "konnektor", "Konnektör Hatası" },

            // Kablo
            { "kablohatasi", "Kablo Hatası" },
            { "kablo", "Kablo Hatası" },

            // EL Hatası
            { "elhatasi", "EL Hatası" },

            // Lehim
            { "lehimhatasi", "Lehim Hatası" },
            { "lehim", "Lehim Hatası" },

            // Aramesa / Diğer
            { "aramesahatasi", "Aramesa Hatası" },
            { "aramesa", "Aramesa Hatası" },
        };

        if (knownErrors.TryGetValue(stripped, out var canonical))
            return canonical;

        // Eşleşme bulunamazsa, fazla boşlukları temizleyip olduğu gibi döndür (Title Case)
        return CultureInfo.GetCultureInfo("tr-TR").TextInfo.ToTitleCase(input.ToLower(CultureInfo.GetCultureInfo("tr-TR")));
    }

    /// <summary>
    /// Mevcut tüm şikayetlerin ErrorDefinition alanını normalize eder.
    /// </summary>
    [HttpPost("normalize-errors")]
    public async Task<IActionResult> NormalizeAllErrors()
    {
        var complaints = await _context.Complaints
            .Where(c => !string.IsNullOrEmpty(c.ErrorDefinition))
            .ToListAsync();

        int updatedCount = 0;
        foreach (var c in complaints)
        {
            var normalized = NormalizeErrorDefinition(c.ErrorDefinition);
            if (normalized != c.ErrorDefinition)
            {
                Console.WriteLine($"----> Normalize: '{c.ErrorDefinition}' → '{normalized}' (#{c.ComplaintNumber})");
                c.ErrorDefinition = normalized;
                updatedCount++;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = $"{updatedCount} adet şikayetin hata tanımı normalize edildi. (Toplam: {complaints.Count})" });
    }
}
