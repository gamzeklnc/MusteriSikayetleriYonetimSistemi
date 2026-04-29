using ComplaintsAPI.Application.Interfaces;
using ComplaintsAPI.Infrastructure.Data;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ComplaintsAPI.Infrastructure.Services;

public class EmailSmtpService : IEmailService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<EmailSmtpService> _logger;

    public EmailSmtpService(AppDbContext context, IConfiguration config, ILogger<EmailSmtpService> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    public async Task SendEmailAsync(string from, string to, string subject, string body)
    {
        var username = _config["EmailSettings:Username"] ?? "";
        var password = _config["EmailSettings:Password"];
        
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Müşteri Şikayetleri Yönetim Sistemi", username));
        message.To.Add(new MailboxAddress("", to));
        if (!string.IsNullOrEmpty(from) && from != username)
        {
            message.ReplyTo.Add(new MailboxAddress("", from));
        }
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = body };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        
        var host = _config["EmailSettings:Host"] ?? "localhost";
        var port = int.Parse(_config["EmailSettings:Port"] ?? "587");

        _logger.LogInformation($"[EMAIL] Şifre durumu: {(string.IsNullOrEmpty(password) ? "BOŞ" : "DOLU ✓")}");

        if (string.IsNullOrEmpty(password))
        {
            _logger.LogWarning("--------------------------------------------------");
            _logger.LogWarning($"EMAIL SİMÜLASYON (Şifre yok)");
            _logger.LogWarning($"From: {from}");
            _logger.LogWarning($"To: {to}");
            _logger.LogWarning($"Subject: {subject}");
            _logger.LogWarning("--------------------------------------------------");
            return;
        }

        var enableSslStr = _config["EmailSettings:EnableSsl"];
        bool enableSsl = string.IsNullOrEmpty(enableSslStr) ? true : bool.Parse(enableSslStr);

        client.ServerCertificateValidationCallback = (s, c, h, e) => true;

        var options = enableSsl 
            ? (port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls) 
            : SecureSocketOptions.Auto;

        if (!enableSsl)
        {
            options = SecureSocketOptions.None;
        }

        await client.ConnectAsync(host, port, options);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendToDepartmentsAsync(string from, string[] departmentNames, string subject, string body)
    {
        _logger.LogInformation($"[EMAIL] Hedef departmanlar: {string.Join(", ", departmentNames)}");
        
        var targetEmails = await _context.Users
            .Where(u => !u.IsDeleted && u.Department != null && departmentNames.Contains(u.Department.Name) && !string.IsNullOrEmpty(u.Email))
            .Select(u => u.Email)
            .Distinct()
            .ToListAsync();

        _logger.LogInformation($"[EMAIL] Bulunan alıcı sayısı: {targetEmails.Count}");
        foreach (var e in targetEmails) _logger.LogInformation($"[EMAIL]   → {e}");

        if (targetEmails.Count == 0)
        {
            _logger.LogWarning("[EMAIL] UYARI: Hedef departmanlarda geçerli e-posta adresine sahip kullanıcı bulunamadı!");
            
            var allDepts = await _context.Users
                .Where(u => !u.IsDeleted)
                .Select(u => u.Department != null ? u.Department.Name : "Bilinmiyor")
                .Distinct()
                .ToListAsync();
            _logger.LogInformation($"[EMAIL] Mevcut aktif departmanlar: {string.Join(", ", allDepts)}");
            return;
        }

        foreach (var email in targetEmails)
        {
            try 
            {
                _logger.LogInformation($"[EMAIL] Gönderiliyor: {email}");
                await SendEmailAsync(from, email, subject, body);
                _logger.LogInformation($"[EMAIL] ✓ Başarıyla gönderildi: {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[EMAIL] ✗ HATA ({email}): {ex.Message}");
            }
        }
    }
}
