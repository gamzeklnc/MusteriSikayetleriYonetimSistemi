using System;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

class Program
{
    static async Task Main()
    {
        var host = "srvc137.trwww.com";
        var port = 465;
        var username = "report@hsaenerji.net";
        var password = "A}eve6t2";
        
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Test", username));
            message.To.Add(new MailboxAddress("Gamze Kilinc", "gamzekilinc@hsaenerji.com"));
            message.Subject = "Test Email from SmtpTest";
            message.Body = new TextPart("plain") { Text = "This is a test email." };

            using var client = new SmtpClient();
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            Console.WriteLine("Connecting with SslOnConnect...");
            await client.ConnectAsync(host, port, SecureSocketOptions.SslOnConnect);
            
            Console.WriteLine("Authenticating...");
            await client.AuthenticateAsync(username, password);
            
            Console.WriteLine("Sending...");
            await client.SendAsync(message);
            
            Console.WriteLine("Disconnecting...");
            await client.DisconnectAsync(true);
            
            Console.WriteLine("Success!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
        }
    }
}
