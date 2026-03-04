using Microsoft.AspNetCore.Mvc;
using ComplaintsAPI.Application.Interfaces;
using ComplaintsAPI.Application.DTOs;

namespace ComplaintsAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Kullanıcı girişi — JWT token döner</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var token = await _authService.LoginAsync(request.Email, request.Password);
        if (token is null)
            return Unauthorized(new { message = "Geçersiz e-posta veya şifre." });

        return Ok(new LoginResponse(token));
    }

    /// <summary>Access token yenileme (ileride implement edilecek)</summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string token)
    {
        var newToken = await _authService.RefreshTokenAsync(token);
        if (newToken is null)
            return Unauthorized();

        return Ok(new LoginResponse(newToken));
    }
}
