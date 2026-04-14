using ComplaintsAPI.Application.Interfaces;
using ComplaintsAPI.Infrastructure.Data;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MimeKit;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ComplaintsAPI.Infrastructure.Services;

public class EmailSmtpService : IEmailService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public EmailSmtpService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task SendEmailAsync(string from, string to, string subject, string body)
    {
        var username = _config["EmailSettings:Username"];
        var password = _config["EmailSettings:Password"];
        
        var message = new MimeMessage();
        // Gonderen adres her zaman kimlik dogrulanan adres olmali (Sender Address Rejected hatasini onlemek icin)
        message.From.Add(new MailboxAddress("Müşteri Şikayetleri Yönetim Sistemi", username));
        message.To.Add(new MailboxAddress("", to));
        // Yanitla (Reply-To) kismina asil kullaniciyi koyabiliriz
        if (!string.IsNullOrEmpty(from) && from != username)
        {
            message.ReplyTo.Add(new MailboxAddress("", from));
        }
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = body };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        
        var host = _config["EmailSettings:Host"];
        var port = int.Parse(_config["EmailSettings:Port"] ?? "587");

        Console.WriteLine($"[EMAIL] Şifre durumu: {(string.IsNullOrEmpty(password) ? "BOŞ" : "DOLU ✓")}");
        
        if (string.IsNullOrEmpty(password))
        {
            Console.WriteLine("--------------------------------------------------");
            Console.WriteLine($"EMAIL SİMÜLASYON (Şifre yok)");
            Console.WriteLine($"From: {from}");
            Console.WriteLine($"To: {to}");
            Console.WriteLine($"Subject: {subject}");
            Console.WriteLine("--------------------------------------------------");
            return;
        }

        var options = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
        await client.ConnectAsync(host, port, options);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendToDepartmentsAsync(string from, string[] departmentNames, string subject, string body)
    {
        Console.WriteLine($"[EMAIL] Hedef departmanlar: {string.Join(", ", departmentNames)}");
        
        var targetEmails = await _context.Users
            .Where(u => !u.IsDeleted && u.Department != null && departmentNames.Contains(u.Department.Name))
            .Select(u => u.Email)
            .Distinct()
            .ToListAsync();

        Console.WriteLine($"[EMAIL] Bulunan alıcı sayısı: {targetEmails.Count}");
        foreach (var e in targetEmails) Console.WriteLine($"[EMAIL]   → {e}");

        if (targetEmails.Count == 0)
        {
            Console.WriteLine("[EMAIL] UYARI: Hedef departmanlarda kullanıcı bulunamadı!");
            
            // Veritabanındaki tüm departman adlarını göster
            var allDepts = await _context.Users
                .Where(u => !u.IsDeleted)
                .Select(u => u.Department != null ? u.Department.Name : "Bilinmiyor")
                .Distinct()
                .ToListAsync();
            Console.WriteLine($"[EMAIL] Mevcut departmanlar: {string.Join(", ", allDepts)}");
            return;
        }

        foreach (var email in targetEmails)
        {
            try 
            {
                Console.WriteLine($"[EMAIL] Gönderiliyor: {email}");
                await SendEmailAsync(from, email, subject, body);
                Console.WriteLine($"[EMAIL] ✓ Başarıyla gönderildi: {email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL] ✗ HATA ({email}): {ex.Message}");
            }
        }
    }
}
