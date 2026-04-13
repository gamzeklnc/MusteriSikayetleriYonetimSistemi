using System.ComponentModel.DataAnnotations;

namespace ComplaintsAPI.Domain.Entities;

public class ComplaintDocument
{
    public int Id { get; set; }
    public int ComplaintId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;
    
    public long FileSize { get; set; }
    
    [MaxLength(100)]
    public string FileType { get; set; } = string.Empty;
    
    public int UploadedById { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string UploadedAtStage { get; set; } = string.Empty;
    public bool Is8DReport { get; set; } = false;

    // Navigation
    public virtual Complaint Complaint { get; set; } = null!;
    public virtual User UploadedBy { get; set; } = null!;
}
