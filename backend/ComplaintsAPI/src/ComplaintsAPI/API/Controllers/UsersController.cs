using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Application.DTOs;
using ComplaintsAPI.Domain.Entities;
using ComplaintsAPI.Domain.Enums;
using ComplaintsAPI.Infrastructure.Data;
using BCrypt.Net;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    private async Task LogActivityAsync(string action, string details)
    {
        _context.UserActivityLogs.Add(new UserActivityLog
        {
            UserId = 1,
            UserFullName = "Sistem Yöneticisi",
            Action = action,
            Details = details,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    /// <summary>Tüm kullanıcıları listele</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _context.Users
            .Include(u => u.Department)
            .Select(u => new UserDto(
                u.Id, u.Name, u.Email,
                u.Role.ToString(), u.DepartmentId,
                u.Department.Name, u.CreatedAt
            ))
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>Yeni kullanıcı oluştur</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = Enum.Parse<UserRole>(request.Role),
            DepartmentId = request.DepartmentId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await LogActivityAsync("Kullanıcı Eklendi", $"İsim: {user.Name}, E-posta: {user.Email}");

        return CreatedAtAction(nameof(GetAll), new { id = user.Id }, user.Id);
    }

    /// <summary>Kullanıcıyı güncelle</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.Name = request.Name;
        user.Email = request.Email;
        user.Role = Enum.Parse<UserRole>(request.Role);
        user.DepartmentId = request.DepartmentId;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _context.SaveChangesAsync();
        await LogActivityAsync("Kullanıcı Güncellendi", $"Güncellenen: {user.Name} ({user.Email})");

        return NoContent();
    }

    /// <summary>Kullanıcıyı sil</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null) return NotFound();

        var userName = user.Name;
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        await LogActivityAsync("Kullanıcı Silindi", $"Silinen: {userName}");

        return NoContent();
    }
}
