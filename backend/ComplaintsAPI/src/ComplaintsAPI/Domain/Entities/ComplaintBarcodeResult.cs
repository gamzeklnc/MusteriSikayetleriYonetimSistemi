namespace ComplaintsAPI.Domain.Entities;

public class ComplaintBarcodeResult
{
    public int Id { get; set; }
    public int ComplaintId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public bool IsJustified { get; set; } // Haklı = true, Haksız = false

    public Complaint Complaint { get; set; } = null!;
}
