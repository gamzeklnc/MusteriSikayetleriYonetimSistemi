using ComplaintsAPI.Domain.Entities;

namespace ComplaintsAPI.Application.Interfaces;

public interface IComplaintRepository
{
    Task<IEnumerable<Complaint>> GetAllAsync(int? departmentId = null, string? status = null);
    Task<Complaint?> GetByIdAsync(int id);
    Task<string?> GetLatestComplaintNumberForYearAsync(int year);
    Task<Complaint> CreateAsync(Complaint complaint);
    Task<Complaint> UpdateAsync(Complaint complaint);
    Task DeleteAsync(Complaint complaint);
    Task AddHistoryAsync(ComplaintHistory history);
}
