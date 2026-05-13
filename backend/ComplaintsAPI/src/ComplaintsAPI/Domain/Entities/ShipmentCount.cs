namespace ComplaintsAPI.Domain.Entities;

public class ShipmentCount
{
    public int Id { get; set; }

    /// <summary>Veritabanındaki Complaints tablosundaki müşteri adıyla eşleştirilmiş isim</summary>
    public string CustomerName { get; set; } = string.Empty;

    /// <summary>Sevk Tarihi — Excel'den alınır</summary>
    public DateTime ShipmentDate { get; set; }

    /// <summary>Sevk Edilen Adet — Excel'den alınır</summary>
    public int ShipmentQuantity { get; set; }

    /// <summary>Sistemdeki bir müşteriyle eşleşip eşleşmediği</summary>
    public bool IsMatched { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
