using Microsoft.AspNetCore.Mvc;
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
            CurrentDepartmentId = req.CurrentDepartmentId,
            CustomerName       = req.CustomerName,
            ProjectName        = req.ProjectName,
            ProjectLocation    = req.ProjectLocation,
            ComplaintDate      = req.ComplaintDate,
            StockCode          = req.StockCode,
            DefectiveQuantity  = req.DefectiveQuantity,
            Brand              = req.Brand,
            Hsa1               = req.Hsa1,
            Hsa2               = req.Hsa2,
            ModulePower        = req.ModulePower,
            ProductionDate     = req.ProductionDate,
            ErrorDefinition    = req.ErrorDefinition,
            IsValidComplaint   = req.IsValidComplaint,
            CreatedById        = 1  // placeholder
        };

        // Şikayet tarihinden yıl/ay/hafta türet
        complaint.SetDerivedDateFields();

        var created = await _repo.CreateAsync(complaint);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created.Id);
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
        c.Status,
        c.CurrentDepartment.Name,
        c.CustomerName,
        c.ProjectName,
        c.ProjectLocation,
        c.ComplaintDate,
        c.RegistrationDate,
        c.StockCode,
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
