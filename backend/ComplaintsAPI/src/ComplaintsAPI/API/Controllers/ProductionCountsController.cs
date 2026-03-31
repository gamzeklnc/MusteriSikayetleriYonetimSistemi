using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Infrastructure.Data;
using ComplaintsAPI.Domain.Entities;

namespace ComplaintsAPI.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductionCountsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductionCountsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/productioncounts
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var data = await _context.ProductionCounts
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .ToListAsync();

        return Ok(data);
    }

    // POST: api/productioncounts
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductionCountDto dto)
    {
        if (dto.Year < 2000 || dto.Year > 2100)
            return BadRequest("Geçersiz yıl değeri.");

        if (dto.Month < 1 || dto.Month > 12)
            return BadRequest("Geçersiz ay değeri.");

        if (dto.Count < 0)
            return BadRequest("Üretim sayısı negatif olamaz.");

        // Check if record already exists for this year/month
        var existing = await _context.ProductionCounts
            .FirstOrDefaultAsync(p => p.Year == dto.Year && p.Month == dto.Month);

        if (existing != null)
        {
            existing.Count = dto.Count;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        var entity = new ProductionCount
        {
            Year = dto.Year,
            Month = dto.Month,
            Count = dto.Count
        };

        _context.ProductionCounts.Add(entity);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = entity.Id }, entity);
    }

    // DELETE: api/productioncounts/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _context.ProductionCounts.FindAsync(id);
        if (entity == null)
            return NotFound("Kayıt bulunamadı.");

        _context.ProductionCounts.Remove(entity);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class ProductionCountDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int Count { get; set; }
}
