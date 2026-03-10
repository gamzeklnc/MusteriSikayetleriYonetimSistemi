namespace ComplaintsAPI.Application.DTOs;

// ── Auth ─────────────────────────────────────────────────────────────────────
public record LoginRequest(string Email, string Password);
public record LoginResponse(string AccessToken, string TokenType = "Bearer");

// ── Departments ───────────────────────────────────────────────────────────────
public record DepartmentDto(int Id, string Name);

// ── Complaints ────────────────────────────────────────────────────────────────

/// <summary>Yeni şikayet oluşturma isteği — kullanıcının gireceği alanlar</summary>
public record CreateComplaintRequest(
    string CustomerName,
    string ProjectName,
    string ProjectLocation,
    string SellerName,
    DateTime ComplaintDate,
    string StockCode,
    List<string>? Barcodes,
    int DefectiveQuantity,
    int? Hsa1,
    int? Hsa2,
    string? Brand,         // Manuel girilebilir
    string? ModulePower,   // Manuel girilebilir
    string? Note,          // Manuel girilebilir
    string? ErrorDefinition
);

/// <summary>Şikayet güncelleme</summary>
public record UpdateComplaintRequest(
    string CustomerName,
    string ProjectName,
    string ProjectLocation,
    string? SellerName,
    DateTime ComplaintDate,
    string StockCode,
    List<string>? Barcodes,
    int DefectiveQuantity,
    string? Brand,
    int? Hsa1,
    int? Hsa2,
    string? ModulePower,
    DateTime? ProductionDate,
    string? ErrorDefinition,
    bool? IsValidComplaint,
    DateTime? LastResponseDate
);

/// <summary>Durum değişikliği (Açık → Kapalı)</summary>
public record ChangeStatusRequest(string Status, string? Note, int? DepartmentId);

/// <summary>Departman transferi</summary>
public record TransferDepartmentRequest(int TargetDepartmentId, string? Note);

/// <summary>Not ekleme isteği</summary>
public record AddNoteRequest(string Note, int DepartmentId);

/// <summary>Kalite raporu güncelleme isteği</summary>
public record QualityReportUpdateRequest(bool IsQualityReported, string? Note);

/// <summary>Liste görünümü için özet DTO</summary>
public record ComplaintDto(
    int Id,
    string ComplaintNumber,            // Şikayet No (Örn: SH-2024-001)
    string Status,                     // Durum
    string CurrentDepartmentName,      // Bekleyen Departman
    string CustomerName,
    string ProjectName,
    string ProjectLocation,
    string SellerName,
    DateTime ComplaintDate,            // Şikayet Tarihi
    DateTime RegistrationDate,         // Kayıt Tarihi (Sisteme giriş)
    string StockCode,
    List<string>? Barcodes,
    string? Brand,
    int? Hsa1,
    int? Hsa2,
    string? ModulePower,
    int DefectiveQuantity,
    string? ErrorDefinition,
    bool? IsValidComplaint,
    DateTime? LastResponseDate,
    DateTime? ProductionDate,
    string? InitialNote,
    int ComplaintYear,
    int ComplaintMonth,
    int ComplaintWeek,
    string CreatedByName,
    DateTime CreatedAt,
    bool IsQualityReported,
    string? QualityReportNote
);

/// <summary>Geçmiş satırı</summary>
public record ComplaintHistoryDto(
    int Id,
    string? FromStatus,
    string? ToStatus,
    string ChangedByName,
    string? DepartmentName,
    string? Note,
    DateTime ChangedAt
);

/// <summary>Detay sayfası için tam DTO</summary>
public record ComplaintDetailDto(
    ComplaintDto Complaint,
    IEnumerable<ComplaintHistoryDto> History
);

// ── Users ─────────────────────────────────────────────────────────────────────
public record CreateUserRequest(
    string Name, string Email, string Password, string Role, int DepartmentId
);

public record UserDto(
    int Id, string Name, string Email, string Role,
    int DepartmentId, string DepartmentName, DateTime CreatedAt
);

// ── Reports ───────────────────────────────────────────────────────────────────
public record ComplaintStatisticsDto(
    int TotalComplaints,
    int OpenComplaints,
    int ClosedComplaints,
    IEnumerable<DepartmentStatDto> ByDepartment
);
public record DepartmentStatDto(string DepartmentName, int Count);
