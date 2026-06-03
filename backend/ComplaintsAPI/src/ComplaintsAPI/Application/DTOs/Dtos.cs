using System.Text.Json.Serialization;

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
    string? StockCode,
    List<string>? Barcodes,
    int DefectiveQuantity,
    int? Hsa1,
    int? Hsa2,
    string? Brand,         // Manuel girilebilir
    string? ModulePower,   // Manuel girilebilir
    string? Note           // Manuel girilebilir
);

/// <summary>Şikayet güncelleme</summary>
public record UpdateComplaintRequest(
    string CustomerName,
    string ProjectName,
    string ProjectLocation,
    string? SellerName,
    DateTime ComplaintDate,
    string? StockCode,
    List<string>? Barcodes,
    int DefectiveQuantity,
    string? Brand,
    int? Hsa1,
    int? Hsa2,
    string? ModulePower,
    DateTime? ProductionDate,
    string? ErrorDefinition,
    bool? IsValidComplaint,
    DateTime? LastResponseDate,
    string? Status,
    int? CurrentDepartmentId,
    bool? IsQualityReported,
    bool? IsManagementApproved,
    string? OperationalStage,
    int? JustifiedHsa1Count,
    int? JustifiedHsa2Count,
    int? JustifiedOtherCount,
    int? UnjustifiedHsa1Count,
    int? UnjustifiedHsa2Count,
    int? UnjustifiedOtherCount,
    bool? Has8DReport,
    List<ComplaintBarcodeResultDto>? BarcodeResults,
    string? Note
);

/// <summary>Durum değişikliği (Açık → Kapalı)</summary>
public record ChangeStatusRequest(string Status, string? Note, int? DepartmentId);

/// <summary>Departman transferi</summary>
public record TransferDepartmentRequest(int TargetDepartmentId, string? Note);

/// <summary>Not ekleme isteği</summary>
public record AddNoteRequest(string Note, int DepartmentId);
public record UpdateNoteRequest(string Note);

/// <summary>Kalite raporu güncelleme isteği</summary>
public class QualityReportUpdateRequest
{
    [JsonPropertyName("isQualityReported")]
    public bool IsQualityReported { get; set; }

    [JsonPropertyName("note")]
    public string? Note { get; set; }

    [JsonPropertyName("errorDefinition")]
    public string? ErrorDefinition { get; set; }

    [JsonPropertyName("has8DReport")]
    public bool? Has8DReport { get; set; }
}

/// <summary>Yönetim onayı isteği</summary>
public record ManagementApprovalRequest(bool? IsApproved, string? Note);

/// <summary>Müşteri geri dönüşü güncelleme isteği</summary>
public record CustomerFeedbackRequest(bool IsDone, string? Note);

public record OperationalStageRequest(
    string Stage, 
    string? Note,
    int? JustifiedHsa1Count,
    int? JustifiedHsa2Count,
    int? JustifiedOtherCount,
    int? UnjustifiedHsa1Count,
    int? UnjustifiedHsa2Count,
    int? UnjustifiedOtherCount,
    bool? Has8DReport,
    List<ComplaintBarcodeResultDto>? BarcodeResults
);

public record UpdateTargetDateRequest(bool? HasTargetDate, DateTime? TargetDate);

public record ComplaintBarcodeResultDto(
    int Id,
    string Barcode,
    string? Factory,
    bool? IsJustified
);

public record ComplaintDocumentDto(
    int Id,
    string FileName,
    long FileSize,
    string FileType,
    string UploadedByName,
    DateTime UploadedAt,
    string UploadedAtStage,
    bool Is8DReport
);

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
    string? StockCode,
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
    string? QualityReportNote,
    string? QualityReportedByName,
    bool? IsManagementApproved,
    string? ManagementApprovalNote,
    string? ManagementApprovedByName,
    bool IsCustomerFeedbackDone,
    string? CustomerFeedbackNote,
    string? CustomerFeedbackByName,
    string? OperationalStage,
    int JustifiedHsa1Count,
    int JustifiedHsa2Count,
    int JustifiedOtherCount,
    int UnjustifiedHsa1Count,
    int UnjustifiedHsa2Count,
    int UnjustifiedOtherCount,
    bool? Has8DReport,
    IEnumerable<ComplaintBarcodeResultDto> BarcodeResults,
    IEnumerable<ComplaintDocumentDto> Documents,
    bool? HasTargetDate,
    DateTime? TargetDate
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

public record UpdateUserRequest(
    string Name, string Email, string? Password, string Role, int? DepartmentId
);

public record UserDto(
    int Id, string Name, string Email, string Role,
    int? DepartmentId, string? DepartmentName, DateTime CreatedAt
);

// ── Reports ───────────────────────────────────────────────────────────────────
public record DashboardStatsDto(
    int TotalComplaints,
    int OpenComplaints,
    int ClosedComplaints,
    int TotalJustifiedProducts,
    int TotalUnjustifiedProducts,
    double JustifiedRatio,

    // GLOBAL STATS (All time, ignoring filters)
    int GlobalTotalComplaints,
    int GlobalOpenComplaints,
    int GlobalClosedComplaints,
    int GlobalTotalJustifiedProducts,
    int GlobalTotalUnjustifiedProducts,
    double GlobalJustifiedRatio,

    IEnumerable<MonthlyStatDto> MonthlyStats,
    JustificationChartDto JustificationChart,
    IEnumerable<YearlyJustificationDto> YearlyStats,
    IEnumerable<MonthlyJustificationRateDto> MonthlyJustificationStats,
    IEnumerable<BrandStatDto> BrandStats,
    IEnumerable<string> AllBrands,
    IEnumerable<ErrorStatDto> ErrorStats,
    IEnumerable<SourceStatDto> SourceStats,
    IEnumerable<CustomerErrorStatDto> CustomerErrorStats,
    IEnumerable<string> AllCustomers,
    IEnumerable<string> AllErrorLabels
);

public record MonthlyJustificationRateDto(int Month, double Rate, long ProductionCount);

public record BrandStatDto(string BrandName, int ComplaintCount, double JustificationRate);

public record ErrorStatDto(string ErrorLabel, int TotalCount, IEnumerable<BrandBreakdownDto> BrandBreakdown);

public record BrandBreakdownDto(string BrandName, int Count);

public record SourceStatDto(string SourceLabel, int TotalCount, int JustifiedCount, long ProductionCount = 0, double JustificationRate = 0);

public record CustomerErrorStatDto(string Label, int Count, int ProductCount, long ShipmentQuantity, double DefectRate);

public record YearlyJustificationDto(int Year, double Rate, long ProductionCount);

public record JustificationChartDto(
    double FirstHalfRate,
    double SecondHalfRate,
    double CumulativeRate
);

public record MonthlyStatDto(
    string Month, // e.g., "03/26"
    int Count,
    int CumulativeCount
);

public record ComplaintStatisticsDto(
    int TotalComplaints,
    int OpenComplaints,
    int ClosedComplaints,
    IEnumerable<DepartmentStatDto> ByDepartment
);
public record DepartmentStatDto(string DepartmentName, int Count);

// ── Error Options ─────────────────────────────────────────────────────────────
public record ErrorDefinitionOptionDto(int Id, string Label);
public record CreateErrorOptionRequest(string Label);

// ── User Activity Logs ────────────────────────────────────────────────────────
public record UserActivityLogDto(
    int Id,
    int? UserId,
    string? UserFullName,
    string? Action,
    string? Details,
    DateTime CreatedAt
);
