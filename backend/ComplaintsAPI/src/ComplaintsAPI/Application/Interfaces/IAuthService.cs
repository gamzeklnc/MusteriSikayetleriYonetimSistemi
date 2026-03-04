using ComplaintsAPI.Domain.Entities;

namespace ComplaintsAPI.Application.Interfaces;

public interface IAuthService
{
    Task<string?> LoginAsync(string email, string password);
    Task<string?> RefreshTokenAsync(string token);
}
