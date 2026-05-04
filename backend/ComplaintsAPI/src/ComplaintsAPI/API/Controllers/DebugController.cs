using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Infrastructure.Data;
using System.Linq;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly AppDbContext _context;
    public DebugController(AppDbContext context) { _context = context; }

    [HttpGet("check-data")]
    public async Task<IActionResult> CheckData()
    {
        var data = await _context.Complaints
            .Where(c => !string.IsNullOrEmpty(c.ErrorDefinition))
            .Select(c => new { 
                c.ComplaintNumber, 
                c.CustomerName, 
                c.ErrorDefinition, 
                c.DefectiveQuantity 
            })
            .Take(10)
            .ToListAsync();
            
        return Ok(data);
    }
}
