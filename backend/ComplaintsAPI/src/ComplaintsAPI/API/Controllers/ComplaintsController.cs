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

        // Şikayet Numarası Üret (Örn: SH-20240304-001)
        var today = DateTime.Now;
        var datePart = today.ToString("yyyyMMdd");
        
        var countToday = (await _repo.GetAllAsync(null, null))
            .Count(x => x.RegistrationDate.Date == today.Date);
        
        var nextId = countToday + 1;
        complaint.ComplaintNumber = $"SH-{datePart}-{nextId:D3}";

        var created = await _repo.CreateAsync(complaint);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created.Id);
    }

    private void DeriveFieldsFromStockCode(Complaint c)
    {
        // Eğer marka veya güç zaten manuel girilmişse (ve boş değilse) dokunma
        if (!string.IsNullOrWhiteSpace(c.Brand) && !string.IsNullOrWhiteSpace(c.ModulePower))
        {
            return;
        }

        // Sadece boş olan kısımları stok koduna göre doldur
        if (c.StockCode.StartsWith("EL", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(c.Brand)) c.Brand = "Elin";
            if (string.IsNullOrWhiteSpace(c.ModulePower)) c.ModulePower = "450W";
        }
        else if (c.StockCode.StartsWith("CW", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(c.Brand)) c.Brand = "CW Enerji";
            if (string.IsNullOrWhiteSpace(c.ModulePower)) c.ModulePower = "550W";
        }
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
        c.ComplaintYear,
        c.ComplaintMonth,
        c.ComplaintWeek,
        c.CreatedBy.Name,
        c.CreatedAt
    );
}
