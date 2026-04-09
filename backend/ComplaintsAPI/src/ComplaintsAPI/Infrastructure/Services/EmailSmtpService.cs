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

        if (string.IsNullOrEmpty(password))
        {
            // Fallback for development: Log the email instead of sending
            Console.WriteLine("--------------------------------------------------");
            Console.WriteLine($"SENDING EMAIL (SIMULATED - No Password)");
            Console.WriteLine($"From: {from}");
            Console.WriteLine($"To: {to}");
            Console.WriteLine($"Subject: {subject}");
            Console.WriteLine($"Body: {body}");
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
        var targetEmails = await _context.Users
            .Where(u => !u.IsDeleted && departmentNames.Contains(u.Department.Name))
            .Select(u => u.Email)
            .Distinct()
            .ToListAsync();

        foreach (var email in targetEmails)
        {
            try 
            {
                await SendEmailAsync(from, email, subject, body);
            }
            catch (Exception ex)
            {
                // In a real app, use a logger here
                Console.WriteLine($"Error sending email to {email}: {ex.Message}");
            }
        }
    }
}
