using System.Threading.Tasks;

namespace ComplaintsAPI.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string from, string to, string subject, string body);
    Task SendToDepartmentsAsync(string from, string[] departmentNames, string subject, string body);
}
