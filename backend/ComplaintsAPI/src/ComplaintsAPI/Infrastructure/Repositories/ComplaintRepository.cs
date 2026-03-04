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
            .Include(c => c.CurrentDepartment)
            .Include(c => c.CreatedBy)
            .AsQueryable();

        if (departmentId.HasValue)
            query = query.Where(c => c.CurrentDepartmentId == departmentId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status.ToString() == status);

        return await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
    }

    public async Task<Complaint?> GetByIdAsync(int id)
    {
        return await _context.Complaints
            .Include(c => c.CurrentDepartment)
            .Include(c => c.CreatedBy)
            .Include(c => c.History)
                .ThenInclude(h => h.ChangedBy)
            .FirstOrDefaultAsync(c => c.Id == id);
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

    public async Task AddHistoryAsync(ComplaintHistory history)
    {
        _context.ComplaintHistories.Add(history);
        await _context.SaveChangesAsync();
    }
}
