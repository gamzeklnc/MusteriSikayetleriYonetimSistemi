using ComplaintsAPI.Domain.Enums;

namespace ComplaintsAPI.Domain.Entities;

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // Navigation
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();
}
