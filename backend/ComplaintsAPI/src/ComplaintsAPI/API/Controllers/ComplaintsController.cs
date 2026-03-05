using Microsoft.AspNetCore.Mvc;
using System.Linq;
using ComplaintsAPI.Application.DTOs;
using ComplaintsAPI.Application.Interfaces;
using ComplaintsAPI.Domain.Entities;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ComplaintsController : ControllerBase
{
    private readonly IComplaintRepository _repo;

    public ComplaintsController(IComplaintRepository repo)
    {
        _repo = repo;
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
        // TODO: createdById JWT claim'den alınacak
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
            CreatedById        = 1, // placeholder
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
        
        var countThisYear = (await _repo.GetAllAsync(null, null))
            .Count(x => x.RegistrationDate.Year == today.Year);
        
        var nextId = countThisYear + 1;
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

        complaint.SetDerivedDateFields();

        await _repo.UpdateAsync(complaint);
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
            ChangedById  = 1  // placeholder
        });

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
            ChangedById  = 1  // placeholder
        });

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
            ChangedById  = 1  // placeholder
        });

        return NoContent();
    }

    // ── Yardımcı Mapper ───────────────────────────────────────────────────────
    private static ComplaintDto MapToDto(Domain.Entities.Complaint c) => new(
        c.Id,
        c.ComplaintNumber,
        c.Status,
        c.CurrentDepartment.Name,
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
        c.CreatedBy.Name,
        c.CreatedAt
    );
}
