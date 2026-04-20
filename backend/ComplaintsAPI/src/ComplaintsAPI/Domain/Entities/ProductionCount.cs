namespace ComplaintsAPI.Domain.Entities;

public class ProductionCount
{
    public int Id { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public int Count { get; set; }
    public int? Hsa1Count { get; set; }
    public int? Hsa2Count { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
