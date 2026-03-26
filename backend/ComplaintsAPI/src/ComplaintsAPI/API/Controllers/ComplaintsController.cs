using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using ComplaintsAPI.Application.DTOs;
using ComplaintsAPI.Application.Interfaces;
using ComplaintsAPI.Domain.Entities;
using ComplaintsAPI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.IO;
using Microsoft.AspNetCore.Http;

namespace ComplaintsAPI.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ComplaintsController : ControllerBase
{
    private readonly IComplaintRepository _repo;
    private readonly AppDbContext _context;

    public ComplaintsController(IComplaintRepository repo, AppDbContext context)
    {
        _repo = repo;
        _context = context;
    }

    private int CurrentUserId => int.TryParse(User.FindFirstValue("userId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id) ? id : 0;
    private string CurrentUserName => User.FindFirstValue("userName") ?? User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("unique_name") ?? "Bilinmeyen Kullanıcı";

    private async Task LogActivityAsync(string action, string details)
    {
        _context.UserActivityLogs.Add(new UserActivityLog
        {
            UserId = CurrentUserId,
            UserFullName = CurrentUserName,
            Action = action,
            Details = details,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    /// <summary>Şikayetleri listele — departman ve durum filtresi</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? departmentId, [FromQuery] string? status)
    {
        var list = await _repo.GetAllAsync(departmentId, status);
        var result = list.Select(MapToDto);
        return Ok(result);
    }

    /// <summary>Şikayet detayı + notlar/geçmiş</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _repo.GetByIdAsync(id);
        if (c is null) return NotFound();

        var history = c.History.Select(h => new ComplaintHistoryDto(
            h.Id, h.FromStatus, h.ToStatus,
            h.ChangedBy.Name,
            h.Department?.Name,
            h.Note, h.ChangedAt
        ));

        return Ok(new ComplaintDetailDto(MapToDto(c), history));
    }

    /// <summary>Yeni şikayet oluştur</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateComplaintRequest req)
    {
        var complaint = new Complaint
        {
            CustomerName       = req.CustomerName,
            ProjectName        = req.ProjectName,
            ProjectLocation    = req.ProjectLocation,
            SellerName         = req.SellerName,
            InitialNote        = req.Note,
            ComplaintDate      = req.ComplaintDate,
            StockCode          = req.StockCode,
            Barcodes           = req.Barcodes != null ? string.Join(",", req.Barcodes) : "",
            DefectiveQuantity  = req.DefectiveQuantity,
            Hsa1               = req.Hsa1,
            Hsa2               = req.Hsa2,
            Brand              = req.Brand,       // Manuel girilen
            ModulePower        = req.ModulePower, // Manuel girilen
            CreatedById        = CurrentUserId,
            Status             = "Acik",
            CurrentDepartmentId = 2 // Varsayılan "Kalite" departmanı (ID: 2)
        };

        // Stok kodundan marka ve güç bilgisi türet (Simülasyon)
        DeriveFieldsFromStockCode(complaint);
        
        // Şikayet tarihinden yıl/ay/hafta türet
        complaint.SetDerivedDateFields();

        // Şikayet Numarası Üret (Örn: 26-06)
        var today = DateTime.Now;
        var yearPart = today.ToString("yy"); // Son iki hane (Örn: 26)
        
        var complaintsThisYear = (await _repo.GetAllAsync(null, null))
            .Where(x => x.RegistrationDate.Year == today.Year)
            .ToList();
            
        int nextId = 1;
        if (complaintsThisYear.Any())
        {
            var maxIdStr = complaintsThisYear
                .Select(x => x.ComplaintNumber.Split('-').LastOrDefault())
                .Where(x => int.TryParse(x, out _))
                .Select(x => int.Parse(x!))
                .DefaultIfEmpty(0)
                .Max();
                
            nextId = maxIdStr + 1;
        }
        
        complaint.ComplaintNumber = $"{yearPart}-{nextId:D2}";

        var created = await _repo.CreateAsync(complaint);
        
        // Eğer Formdan bir Not bilgisi de geldiyse, doğrudan şikayet geçmişine ilk not olarak ekleyelim.
        if (!string.IsNullOrWhiteSpace(req.Note))
        {
            await _repo.AddHistoryAsync(new ComplaintHistory
            {
                ComplaintId = created.Id,
                Note = req.Note,
                DepartmentId = created.CurrentDepartmentId, // İlk açıldığı departman (Kalite)
                FromStatus = null,
                ToStatus = null,
                ChangedById = created.CreatedById
            });
        }

        await LogActivityAsync("Şikayet Oluşturuldu", $"Şikayet No: {created.ComplaintNumber}");

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created.Id);
    }

    private void DeriveFieldsFromStockCode(Complaint c)
    {
        // Eğer marka veya güç zaten manuel girilmişse (ve boş değilse) dokunma
        if (!string.IsNullOrWhiteSpace(c.Brand) && !string.IsNullOrWhiteSpace(c.ModulePower))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(c.StockCode))
            return;

        // 1) HSA (Brand: Maviçam, Power: Before 'W')
        if (c.StockCode.StartsWith("HSA", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(c.Brand)) c.Brand = "Maviçam";
            if (string.IsNullOrWhiteSpace(c.ModulePower)) c.ModulePower = ExtractPowerBeforeW(c.StockCode);
        }
        // 2) JKM (Brand: Jinko, Power: After 'JKM')
        else if (c.StockCode.StartsWith("JKM", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(c.Brand)) c.Brand = "Jinko";
            if (string.IsNullOrWhiteSpace(c.ModulePower)) c.ModulePower = ExtractPowerAfterPrefix(c.StockCode, "JKM");
        }
        // 3) SunPwt (Brand: SunPwt, Power: Before 'W')
        else if (c.StockCode.StartsWith("SunPwt", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(c.Brand)) c.Brand = "SunPwt";
            if (string.IsNullOrWhiteSpace(c.ModulePower)) c.ModulePower = ExtractPowerBeforeW(c.StockCode);
        }
        // 4) JAM (Brand: Ja solar, Power: Before 'W')
        else if (c.StockCode.StartsWith("JAM", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(c.Brand)) c.Brand = "Ja solar";
            if (string.IsNullOrWhiteSpace(c.ModulePower)) c.ModulePower = ExtractPowerBeforeW(c.StockCode);
        }
        // Eski kural 
        else if (c.StockCode.StartsWith("EL", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(c.Brand)) c.Brand = "Elin";
            if (string.IsNullOrWhiteSpace(c.ModulePower)) c.ModulePower = "450W";
        }
        // Eski kural
        else if (c.StockCode.StartsWith("CW", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(c.Brand)) c.Brand = "CW Enerji";
            if (string.IsNullOrWhiteSpace(c.ModulePower)) c.ModulePower = "550W";
        }
    }

    private string ExtractPowerBeforeW(string stockCode)
    {
        // Example: HSA66M1CGGNS-610W-TR -> 610W
        // Example: SunPwt-M1C-610W-T10 -> 610W
        var match = System.Text.RegularExpressions.Regex.Match(stockCode, @"(\d+)[Ww]");
        if (match.Success)
        {
            return match.Value.ToUpper();
        }
        return "";
    }

    private string ExtractPowerAfterPrefix(string stockCode, string prefix)
    {
        // Example: JKM610N-66HL4M-BDV -> 610W
        // Expected result should append 'W' ? Wait, rule says: "Power: extracted digits right after JKM (e.g. 610)"
        // It's probably better to append 'W' so it matches other power fields like "610W". 
        // Let's extract digits right after JKM
        
        int prefixLength = prefix.Length;
        if (stockCode.Length <= prefixLength) return "";

        int end = prefixLength;
        while (end < stockCode.Length && char.IsDigit(stockCode[end]))
        {
            end++;
        }

        if (end > prefixLength)
        {
            string power = stockCode.Substring(prefixLength, end - prefixLength);
            return power + "W"; // standardizing format to 610W
        }
        
        return "";
    }

    /// <summary>Şikayeti güncelle</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateComplaintRequest req)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint is null) return NotFound();

        complaint.CustomerName      = req.CustomerName;
        complaint.ProjectName       = req.ProjectName;
        complaint.ProjectLocation   = req.ProjectLocation;
        if (req.SellerName != null)
            complaint.SellerName    = req.SellerName;
        complaint.ComplaintDate     = req.ComplaintDate;
        complaint.StockCode         = req.StockCode;
        if (req.Barcodes != null)
            complaint.Barcodes      = string.Join(",", req.Barcodes);
        complaint.DefectiveQuantity = req.DefectiveQuantity;
        complaint.Brand             = req.Brand;
        complaint.Hsa1              = req.Hsa1;
        complaint.Hsa2              = req.Hsa2;
        complaint.ModulePower       = req.ModulePower;
        complaint.ProductionDate    = req.ProductionDate;
        complaint.ErrorDefinition   = req.ErrorDefinition;
        complaint.IsValidComplaint  = req.IsValidComplaint;
        complaint.LastResponseDate  = req.LastResponseDate;

        if (!string.IsNullOrEmpty(req.Status))
            complaint.Status = req.Status;
        if (req.CurrentDepartmentId.HasValue)
            complaint.CurrentDepartmentId = req.CurrentDepartmentId.Value;
        if (req.IsQualityReported.HasValue)
            complaint.IsQualityReported = req.IsQualityReported.Value;
        if (req.IsManagementApproved.HasValue)
            complaint.IsManagementApproved = req.IsManagementApproved.Value;
        if (req.OperationalStage != null)
            complaint.OperationalStage = req.OperationalStage;

        if (req.JustifiedHsa1Count.HasValue) complaint.JustifiedHsa1Count = req.JustifiedHsa1Count.Value;
        if (req.JustifiedHsa2Count.HasValue) complaint.JustifiedHsa2Count = req.JustifiedHsa2Count.Value;
        if (req.JustifiedOtherCount.HasValue) complaint.JustifiedOtherCount = req.JustifiedOtherCount.Value;
        if (req.UnjustifiedHsa1Count.HasValue) complaint.UnjustifiedHsa1Count = req.UnjustifiedHsa1Count.Value;
        if (req.UnjustifiedHsa2Count.HasValue) complaint.UnjustifiedHsa2Count = req.UnjustifiedHsa2Count.Value;
        if (req.UnjustifiedOtherCount.HasValue) complaint.UnjustifiedOtherCount = req.UnjustifiedOtherCount.Value;

        if (req.BarcodeResults != null)
        {
            // Basit senaryo: Mevcutları silip yenileri ekle
            _context.ComplaintBarcodeResults.RemoveRange(complaint.BarcodeResults);
            foreach (var br in req.BarcodeResults)
            {
                complaint.BarcodeResults.Add(new ComplaintBarcodeResult
                {
                    Barcode = br.Barcode,
                    IsJustified = br.IsJustified,
                    ComplaintId = complaint.Id
                });
            }
        }

        complaint.SetDerivedDateFields();

        await _repo.UpdateAsync(complaint);
        await LogActivityAsync("Şikayet Güncellendi", $"Şikayet No: {complaint.ComplaintNumber}");
        return NoContent();
    }

    /// <summary>Durum değiştir: Açık ↔ Kapalı</summary>
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeStatusRequest req)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint is null) return NotFound();

        var oldStatus = complaint.Status;
        complaint.Status = req.Status;

        await _repo.UpdateAsync(complaint);
        await _repo.AddHistoryAsync(new ComplaintHistory
        {
            ComplaintId  = id,
            FromStatus   = oldStatus,
            ToStatus     = req.Status,
            Note         = req.Note,
            DepartmentId = req.DepartmentId,
            ChangedById  = CurrentUserId
        });

        await LogActivityAsync("Durum Değiştirildi", $"Şikayet No: {complaint.ComplaintNumber}, {oldStatus} -> {req.Status}");

        return NoContent();
    }

    /// <summary>Şikayeti başka departmana yönlendir</summary>
    [HttpPost("{id}/transfer")]
    public async Task<IActionResult> Transfer(int id, [FromBody] TransferDepartmentRequest req)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint is null) return NotFound();

        var oldDept = complaint.CurrentDepartmentId;
        complaint.CurrentDepartmentId = req.TargetDepartmentId;

        await _repo.UpdateAsync(complaint);
        await _repo.AddHistoryAsync(new ComplaintHistory
        {
            ComplaintId  = id,
            FromStatus   = $"Dept:{oldDept}",
            ToStatus     = $"Dept:{req.TargetDepartmentId}",
            Note         = req.Note,
            DepartmentId = req.TargetDepartmentId,
            ChangedById  = CurrentUserId
        });

        await LogActivityAsync("Departman Değiştirildi", $"Şikayet No: {complaint.ComplaintNumber}, Yeni Dept: {req.TargetDepartmentId}");

        return NoContent();
    }

    /// <summary>Şikayet Notları — departman bilgisiyle not ekle</summary>
    [HttpPost("{id}/notes")]
    public async Task<IActionResult> AddNote(int id, [FromBody] AddNoteRequest req)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint is null) return NotFound();

        await _repo.AddHistoryAsync(new ComplaintHistory
        {
            ComplaintId  = id,
            Note         = req.Note,
            DepartmentId = req.DepartmentId,
            ChangedById  = CurrentUserId
        });

        await LogActivityAsync("Not Eklendi", $"Şikayet No: {complaint.ComplaintNumber}");

        return NoContent();
    }

    /// <summary>Kalite Raporu Güncelle</summary>
    [HttpPatch("{id}/quality-report")]
    public async Task<IActionResult> UpdateQualityReport(int id, [FromBody] QualityReportUpdateRequest req)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint is null) return NotFound();

        // Onaylanmış ise değiştirilemez
        if (complaint.IsManagementApproved == true)
            return BadRequest(new { message = "Yönetim tarafından onaylanmış şikayetlerin kalite raporu değiştirilemez." });

        // Kalite raporu yapıldı olarak işaretlenmiş VE red yoksa (yönetim onay beklemedeyse) değiştirilemez
        if (complaint.IsQualityReported == true && complaint.IsManagementApproved == null)
            return BadRequest(new { message = "Kalite raporu zaten tamamlanmış. Değiştirmek için yönetim onay sürecini bekleyin." });

        complaint.IsQualityReported = req.IsQualityReported;
        complaint.QualityReportNote = req.Note;

        // Hata tanımını güncelle
        complaint.ErrorDefinition = req.ErrorDefinition;

        if (req.IsQualityReported)
            complaint.QualityReportedById = CurrentUserId;
        else
            complaint.QualityReportedById = null;

        // Yeniden rapor yapılırsa red durumunu sıfırla
        if (req.IsQualityReported)
            complaint.IsManagementApproved = null;

        await _repo.UpdateAsync(complaint);
        await LogActivityAsync("Kalite Raporu Güncellendi", $"Şikayet No: {complaint.ComplaintNumber}, Durum: {(req.IsQualityReported ? "Yapıldı" : "Bekliyor")}");
        return Ok(MapToDto(complaint));
    }

    /// <summary>Yönetim onayı ver/reddet</summary>
    [HttpPatch("{id}/management-approval")]
    public async Task<IActionResult> ApproveComplaint(int id, [FromBody] ManagementApprovalRequest req)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint is null) return NotFound();

        complaint.IsManagementApproved = req.IsApproved;
        complaint.ManagementApprovalNote = req.Note;
        complaint.ManagementApprovedById = CurrentUserId;

        // Reddedildiyse kalite raporunu sıfırla → geri Kalite Raporlaması aşamasına dönsün
        if (req.IsApproved == false)
        {
            complaint.IsQualityReported = false;
            complaint.QualityReportedById = null;
        }

        await _repo.UpdateAsync(complaint);
        
        // Geçmişe ekle
        await _repo.AddHistoryAsync(new ComplaintHistory
        {
            ComplaintId = complaint.Id,
            FromStatus = complaint.Status,
            ToStatus = req.IsApproved == true ? "Onaylandi" : "Reddedildi",
            Note = $"Yönetim Onayı: {(req.IsApproved == true ? "Onaylandı" : "Reddedildi")}. Not: {req.Note}",
            ChangedById = CurrentUserId,
            DepartmentId = complaint.CurrentDepartmentId
        });

        await LogActivityAsync("Yönetim Onayı Güncellendi", $"Şikayet No: {complaint.ComplaintNumber}, Durum: {(req.IsApproved == true ? "Onaylandı" : req.IsApproved == false ? "Reddedildi" : "Bekliyor")}");

        return Ok(MapToDto(complaint));
    }

    /// <summary>Müşteri geri dönüşü güncelle</summary>
    [HttpPatch("{id}/customer-feedback")]
    public async Task<IActionResult> UpdateCustomerFeedback(int id, [FromBody] CustomerFeedbackRequest req)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint is null) return NotFound();

        // Sadece yönetim onayladıysa güncellenebilir
        if (complaint.IsManagementApproved != true)
            return BadRequest(new { message = "Yönetim onayı alınmamış şikayetlerde müşteri geri dönüşü yapılamaz." });

        complaint.IsCustomerFeedbackDone = req.IsDone;
        complaint.CustomerFeedbackNote = req.Note;
        if (req.IsDone)
        {
            complaint.CustomerFeedbackById = CurrentUserId;
            complaint.CustomerFeedbackAt = DateTime.UtcNow;
        }
        else
        {
            complaint.CustomerFeedbackAt = null;
        }

        await _repo.UpdateAsync(complaint);
        await LogActivityAsync("Müşteri Geri Dönüşü Güncellendi", $"Şikayet No: {complaint.ComplaintNumber}, Durum: {(req.IsDone ? "Yapıldı" : "Bekliyor")}");
        return Ok(MapToDto(complaint));
    }

    /// <summary>Operasyonel aksiyon aşamasını güncelle</summary>
    [HttpPatch("{id}/operational-stage")]
    public async Task<IActionResult> UpdateOperationalStage(int id, [FromBody] OperationalStageRequest req)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint is null) return NotFound();

        // Müşteri geri dönüşü yapılmamışsa aksiyon aşamasına geçilemez (Opsiyonel kısıt)
        if (!complaint.IsCustomerFeedbackDone)
            return BadRequest(new { message = "Müşteri geri dönüşü yapılmamış şikayetlerde operasyonel aksiyon aşaması seçilemez." });

        var oldStage = complaint.OperationalStage;
        complaint.OperationalStage = req.Stage;

        if (req.JustifiedHsa1Count.HasValue) complaint.JustifiedHsa1Count = req.JustifiedHsa1Count.Value;
        if (req.JustifiedHsa2Count.HasValue) complaint.JustifiedHsa2Count = req.JustifiedHsa2Count.Value;
        if (req.JustifiedOtherCount.HasValue) complaint.JustifiedOtherCount = req.JustifiedOtherCount.Value;
        if (req.UnjustifiedHsa1Count.HasValue) complaint.UnjustifiedHsa1Count = req.UnjustifiedHsa1Count.Value;
        if (req.UnjustifiedHsa2Count.HasValue) complaint.UnjustifiedHsa2Count = req.UnjustifiedHsa2Count.Value;
        if (req.UnjustifiedOtherCount.HasValue) complaint.UnjustifiedOtherCount = req.UnjustifiedOtherCount.Value;

        if (req.BarcodeResults != null)
        {
            _context.ComplaintBarcodeResults.RemoveRange(complaint.BarcodeResults);
            foreach (var br in req.BarcodeResults)
            {
                complaint.BarcodeResults.Add(new ComplaintBarcodeResult
                {
                    Barcode = br.Barcode,
                    IsJustified = br.IsJustified,
                    ComplaintId = complaint.Id
                });
            }
        }

        await _repo.UpdateAsync(complaint);

        // Geçmişe ekle
        await _repo.AddHistoryAsync(new ComplaintHistory
        {
            ComplaintId = complaint.Id,
            FromStatus = oldStage != null ? $"Aksiyon:{oldStage}" : null,
            ToStatus = $"Aksiyon:{req.Stage}",
            Note = $"Aksiyon Aşaması Değiştirildi: {req.Stage}. Not: {req.Note}",
            ChangedById = CurrentUserId,
            DepartmentId = complaint.CurrentDepartmentId
        });

        await LogActivityAsync("Operasyonel Aşama Güncellendi", $"Şikayet No: {complaint.ComplaintNumber}, Yeni Aşama: {req.Stage}");

        return Ok(MapToDto(complaint));
    }

    /// <summary>Şikayeti sil (Sadece Admin)</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint is null) return NotFound();

        var complaintNumber = complaint.ComplaintNumber;
        await _repo.DeleteAsync(complaint);
        
        await LogActivityAsync("Şikayet Silindi", $"Şikayet No: {complaintNumber}");
        
        return NoContent();
    }

    // ── Dosya Yükleme / İndirme ───────────────────

    [HttpPost("{id}/documents")]
    public async Task<IActionResult> UploadDocument(int id, IFormFile file)
    {
        var complaint = await _repo.GetByIdAsync(id);
        if (complaint == null) return NotFound("Şikayet bulunamadı.");

        if (file == null || file.Length == 0) return BadRequest("Dosya seçilmedi.");

        // Uzantı Kontrolü
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx" };
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest("Sadece PDF, Word ve Excel dosyalarına izin verilir.");
        }

        // Klasör Oluşturma
        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "complaint-documents");
        if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

        // Benzersiz Dosya Adı
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var doc = new Domain.Entities.ComplaintDocument
        {
            ComplaintId = id,
            FileName = file.FileName,
            FilePath = $"/uploads/complaint-documents/{fileName}",
            FileSize = file.Length,
            FileType = file.ContentType,
            UploadedById = CurrentUserId,
            UploadedAt = DateTime.UtcNow
        };

        complaint.Documents.Add(doc);
        await _repo.UpdateAsync(complaint);

        await LogActivityAsync("Dosya Yüklendi", $"Şikayet No: {complaint.ComplaintNumber}, Dosya: {file.FileName}");

        return Ok(new ComplaintDocumentDto(
            doc.Id, doc.FileName, doc.FileSize, doc.FileType, CurrentUserName, doc.UploadedAt));
    }

    [HttpGet("documents/{documentId}/download")]
    public async Task<IActionResult> DownloadDocument(int documentId)
    {
        var doc = await _context.ComplaintDocuments.FirstOrDefaultAsync(x => x.Id == documentId);
        if (doc == null) return NotFound("Dosya bulunamadı.");

        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", doc.FilePath.TrimStart('/'));
        if (!System.IO.File.Exists(fullPath)) return NotFound("Dosya sunucuda bulunamadı.");

        var content = await System.IO.File.ReadAllBytesAsync(fullPath);
        return File(content, doc.FileType, doc.FileName);
    }

    // ── Yardımcı Mapper ───────────────────────────────────────────────────────
    private static string GetDescriptiveStatus(Domain.Entities.Complaint c)
    {
        if (c.Status == "Kapali") return "Kapalı";
        
        // RegistrationDate'den itibaren 48 saat (Kayıt tarihi baz alınır)
        var deadline = c.RegistrationDate.AddHours(48);
        var now = DateTime.UtcNow;

        if (!c.IsCustomerFeedbackDone)
        {
            return now <= deadline ? "Açık: Devam ediyor" : "Açık: Gecikti";
        }
        else
        {
            // Müşteri dönüşü yapılmış. CustomerFeedbackAt değeri yoksa (eski kayıtlar) 
            // ama IsCustomerFeedbackDone true ise "Devam ediyor" kabul edebiliriz veya 
            // RegistrationDate+48h ile karşılaştırabiliriz.
            if (c.CustomerFeedbackAt.HasValue)
            {
                return c.CustomerFeedbackAt.Value <= deadline ? "Açık: Devam ediyor" : "Açık: Gecikerek devam ediyor";
            }
            
            // Eğer tarih yoksa ama tamamlanmışsa varsayılan olarak zamanında yapıldı sayalım (veya tam tersi)
            return "Açık: Devam ediyor";
        }
    }

    private static ComplaintDto MapToDto(Domain.Entities.Complaint c) => new(
        c.Id,
        c.ComplaintNumber,
        GetDescriptiveStatus(c),
        c.IsCustomerFeedbackDone ? "Aksiyon Planı" :
        (c.IsManagementApproved == true ? "Müşteri Geri Dönüşü" :
        (c.IsQualityReported ? "Yönetim Onayı" : "Kalite Raporlaması")),
        c.CustomerName,
        c.ProjectName,
        c.ProjectLocation,
        c.SellerName,
        c.ComplaintDate,
        c.RegistrationDate,
        c.StockCode,
        string.IsNullOrEmpty(c.Barcodes) ? new List<string>() : c.Barcodes.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
        c.Brand,
        c.Hsa1,
        c.Hsa2,
        c.ModulePower,
        c.DefectiveQuantity,
        c.ErrorDefinition,
        c.IsValidComplaint,
        c.LastResponseDate,
        c.ProductionDate,
        c.InitialNote,
        c.ComplaintYear,
        c.ComplaintMonth,
        c.ComplaintWeek,
        c.CreatedBy?.Name ?? "Sistem",
        c.CreatedAt,
        c.IsQualityReported,
        c.QualityReportNote,
        c.QualityReportedBy?.Name,
        c.IsManagementApproved,
        c.ManagementApprovalNote,
        c.ManagementApprovedBy?.Name,
        c.IsCustomerFeedbackDone,
        c.CustomerFeedbackNote,
        c.CustomerFeedbackBy?.Name,
        c.OperationalStage,
        c.JustifiedHsa1Count,
        c.JustifiedHsa2Count,
        c.JustifiedOtherCount,
        c.UnjustifiedHsa1Count,
        c.UnjustifiedHsa2Count,
        c.UnjustifiedOtherCount,
        c.BarcodeResults.Select(br => new ComplaintBarcodeResultDto(br.Id, br.Barcode, br.IsJustified)),
        c.Documents.Select(d => new ComplaintDocumentDto(
            d.Id,
            d.FileName,
            d.FileSize,
            d.FileType,
            d.UploadedBy?.Name ?? "Bilinmiyor",
            d.UploadedAt
        ))
    );
}
