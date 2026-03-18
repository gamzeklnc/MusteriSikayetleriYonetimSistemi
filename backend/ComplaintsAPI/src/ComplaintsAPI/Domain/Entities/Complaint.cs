using System.Globalization;

namespace ComplaintsAPI.Domain.Entities;

public class Complaint
{
    public int Id { get; set; }
    public string ComplaintNumber { get; set; } = string.Empty;

    // ── Durum & Departman ────────────────────────────────────────────────────
    /// <summary>Açık / Kapalı</summary>
    public string Status { get; set; } = "Acik";

    /// <summary>Bekleyen Departman — aşamaya göre otomatik atanır</summary>
    public int CurrentDepartmentId { get; set; }

    // ── Müşteri & Proje Bilgileri ────────────────────────────────────────────
    public string CustomerName { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectLocation { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public string? InitialNote { get; set; }

    // ── Tarih Alanları ───────────────────────────────────────────────────────
    /// <summary>Şikayet Tarihi — kullanıcı tarafından girilir</summary>
    public DateTime ComplaintDate { get; set; }

    /// <summary>Kayıt Tarihi — sistem otomatik atar</summary>
    public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

    /// <summary>Son Cevap Tarihi</summary>
    public DateTime? LastResponseDate { get; set; }

    // ── Şikayet Tarihi Türetilen Alanlar ─────────────────────────────────────
    /// <summary>Şikayet Yılı — ComplaintDate'den otomatik</summary>
    public int ComplaintYear { get; set; }

    /// <summary>Şikayet Ayı — ComplaintDate'den otomatik</summary>
    public int ComplaintMonth { get; set; }

    /// <summary>Hafta — ComplaintDate'den otomatik (ISO 8601)</summary>
    public int ComplaintWeek { get; set; }

    // ── Stok & Ürün Bilgileri ────────────────────────────────────────────────
    public string StockCode { get; set; } = string.Empty;

    /// <summary>Barkodlar (Çoklu barkod için virgülle ayrılmış liste, ör: B1,B2,B3)</summary>
    public string Barcodes { get; set; } = string.Empty;


    /// <summary>Marka — stok kodundan otomatik çekilecek</summary>
    public string? Brand { get; set; }

    /// <summary>HSA1 — barkodlardan sayacak</summary>
    public int? Hsa1 { get; set; }

    /// <summary>HSA2 — barkodlardan sayacak</summary>
    public int? Hsa2 { get; set; }

    /// <summary>Modül Gücü — stok kodundan otomatik çekilecek</summary>
    public string? ModulePower { get; set; }

    /// <summary>Ürün Üretim Tarihi — barkoddan otomatik alınacak</summary>
    public DateTime? ProductionDate { get; set; }

    // ── Şikayet Detayları ────────────────────────────────────────────────────
    /// <summary>Kusurlu Ürün Miktarı</summary>
    public int DefectiveQuantity { get; set; }

    /// <summary>Hata Tanımı (Özet) — çoktan seçmeli, virgülle ayrılmış</summary>
    public string? ErrorDefinition { get; set; }

    /// <summary>Haklı/Haksız Şikayet — null: henüz belirlenmedi</summary>
    public bool? IsValidComplaint { get; set; }

    // ── Kalite Raporu ────────────────────────────────────────────────────────
    public bool IsQualityReported { get; set; } = false;
    public string? QualityReportNote { get; set; }
    public int? QualityReportedById { get; set; }

    // ── Yönetim Onayı ────────────────────────────────────────────────────────
    public bool? IsManagementApproved { get; set; }
    public string? ManagementApprovalNote { get; set; }
    public int? ManagementApprovedById { get; set; }

    // ── Müşteri Geri Dönüşü ─────────────────────────────────────────────────
    public bool IsCustomerFeedbackDone { get; set; } = false;
    public string? CustomerFeedbackNote { get; set; }
    public int? CustomerFeedbackById { get; set; }
    public DateTime? CustomerFeedbackAt { get; set; }

    // ── Operasyonel Aksiyonlar ───────────────────────────────────────────────
    public string? OperationalStage { get; set; }

    // ── Haklı / Haksız Takibi ────────────────────────────────────────────────
    public int JustifiedHsa1Count { get; set; } = 0;
    public int JustifiedHsa2Count { get; set; } = 0;
    public int JustifiedOtherCount { get; set; } = 0;
    public int UnjustifiedHsa1Count { get; set; } = 0;
    public int UnjustifiedHsa2Count { get; set; } = 0;
    public int UnjustifiedOtherCount { get; set; } = 0;

    public virtual ICollection<ComplaintBarcodeResult> BarcodeResults { get; set; } = new List<ComplaintBarcodeResult>();

    // ── Sistem Alanları ──────────────────────────────────────────────────────
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ───────────────────────────────────────────────────────────
    public Department CurrentDepartment { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? QualityReportedBy { get; set; }
    public User? ManagementApprovedBy { get; set; }
    public User? CustomerFeedbackBy { get; set; }
    public virtual ICollection<ComplaintDocument> Documents { get; set; } = new List<ComplaintDocument>();
    public ICollection<ComplaintHistory> History { get; set; } = new List<ComplaintHistory>();

    // ── Domain Metodu: tarih alanlarını otomatik doldur ─────────────────────
    public void SetDerivedDateFields()
    {
        ComplaintYear = ComplaintDate.Year;
        ComplaintMonth = ComplaintDate.Month;
        ComplaintWeek = ISOWeek.GetWeekOfYear(ComplaintDate);
    }
}
