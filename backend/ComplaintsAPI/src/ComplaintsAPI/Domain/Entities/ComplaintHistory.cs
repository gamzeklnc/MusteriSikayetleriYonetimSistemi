namespace ComplaintsAPI.Domain.Entities;

public class ComplaintHistory
{
    public int Id { get; set; }
    public int ComplaintId { get; set; }

    /// <summary>Notu ekleyen departman (ŞİKAYET NOTLARI alanı için)</summary>
    public int? DepartmentId { get; set; }

    public string? FromStatus { get; set; }
    public string? ToStatus { get; set; }
    public int? ChangedById { get; set; }
    public string? Note { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Complaint Complaint { get; set; } = null!;
    public User? ChangedBy { get; set; }
    public Department? Department { get; set; }
}
