using System;

namespace ComplaintsAPI.Domain.Entities;

public class UserActivityLog
{
    public int Id { get; set; }
    public int? UserId { get; set; } // Null if system action
    public string UserFullName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // e.g., "Şikayet Silindi"
    public string Details { get; set; } = string.Empty; // e.g., "Şikayet No: SH-2024-001"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Optional navigation property for User
    public User? User { get; set; }
}
