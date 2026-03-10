using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Application.DTOs;
using ComplaintsAPI.Domain.Entities;
using ComplaintsAPI.Infrastructure.Data;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ErrorOptionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ErrorOptionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var options = await _context.ErrorDefinitionOptions
            .Select(o => new ErrorDefinitionOptionDto(o.Id, o.Label))
            .ToListAsync();
        return Ok(options);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateErrorOptionRequest request)
    {
        var option = new ErrorDefinitionOption
        {
            Label = request.Label
        };

        _context.ErrorDefinitionOptions.Add(option);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = option.Id }, option);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateErrorOptionRequest request)
    {
        var option = await _context.ErrorDefinitionOptions.FindAsync(id);
        if (option is null) return NotFound();

        option.Label = request.Label;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var option = await _context.ErrorDefinitionOptions.FindAsync(id);
        if (option is null) return NotFound();

        _context.ErrorDefinitionOptions.Remove(option);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
