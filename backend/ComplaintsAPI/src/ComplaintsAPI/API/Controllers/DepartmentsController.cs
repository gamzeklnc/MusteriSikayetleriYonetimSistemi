using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Application.DTOs;
using ComplaintsAPI.Infrastructure.Data;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public DepartmentsController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>Tüm departmanları listele</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var departments = await _context.Departments
            .Select(d => new DepartmentDto(d.Id, d.Name))
            .ToListAsync();

        return Ok(departments);
    }
}
