using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Application.Interfaces;
using ComplaintsAPI.Domain.Entities;
using ComplaintsAPI.Infrastructure.Data;

namespace ComplaintsAPI.Infrastructure.Repositories;

public class ComplaintRepository : IComplaintRepository
{
    private readonly AppDbContext _context;

    public ComplaintRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Complaint>> GetAllAsync(int? departmentId = null, string? status = null)
    {
        var query = _context.Complaints
            .AsNoTracking()
            .AsQueryable();

        if (departmentId.HasValue)
            query = query.Where(c => c.CurrentDepartmentId == departmentId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status.ToString() == status);

        return await query
            .Include(c => c.CurrentDepartment)
            .Include(c => c.CreatedBy)
            .Include(c => c.QualityReportedBy)
            .Include(c => c.ManagementApprovedBy)
            .Include(c => c.Documents)
                .ThenInclude(d => d.UploadedBy)
            .Include(c => c.BarcodeResults)
            .AsSplitQuery()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<Complaint?> GetByIdAsync(int id)
    {
        return await _context.Complaints
            .Include(c => c.CurrentDepartment)
            .Include(c => c.CreatedBy)
            .Include(c => c.QualityReportedBy)
            .Include(c => c.ManagementApprovedBy)
            .Include(c => c.Documents)
                .ThenInclude(d => d.UploadedBy)
            .Include(c => c.History)
                .ThenInclude(h => h.ChangedBy)
            .Include(c => c.BarcodeResults)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<string?> GetLatestComplaintNumberForYearAsync(int year)
    {
        return await _context.Complaints
            .AsNoTracking()
            .Where(c => c.RegistrationDate.Year == year)
            .OrderByDescending(c => c.RegistrationDate)
            .ThenByDescending(c => c.Id)
            .Select(c => c.ComplaintNumber)
            .FirstOrDefaultAsync();
    }

    public async Task<Complaint> CreateAsync(Complaint complaint)
    {
        _context.Complaints.Add(complaint);
        await _context.SaveChangesAsync();
        return complaint;
    }

    public async Task<Complaint> UpdateAsync(Complaint complaint)
    {
        complaint.UpdatedAt = DateTime.UtcNow;
        _context.Complaints.Update(complaint);
        await _context.SaveChangesAsync();
        return complaint;
    }

    public async Task DeleteAsync(Complaint complaint)
    {
        _context.Complaints.Remove(complaint);
        await _context.SaveChangesAsync();
    }

    public async Task AddHistoryAsync(ComplaintHistory history)
    {
        _context.ComplaintHistories.Add(history);
        await _context.SaveChangesAsync();
    }
}
