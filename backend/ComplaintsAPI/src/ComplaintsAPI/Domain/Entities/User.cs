using ComplaintsAPI.Domain.Enums;

namespace ComplaintsAPI.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int DepartmentId { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Department Department { get; set; } = null!;
    public ICollection<Complaint> CreatedComplaints { get; set; } = new List<Complaint>();
    public ICollection<ComplaintHistory> ComplaintHistories { get; set; } = new List<ComplaintHistory>();
}
