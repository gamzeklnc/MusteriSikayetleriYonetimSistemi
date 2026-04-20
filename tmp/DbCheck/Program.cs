using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace DbCheck
{
    class Program
    {
        static void Main(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseSqlServer("Server=localhost\\SQLEXPRESS;Database=MusteriSikayetleriDB;Trusted_Connection=True;MultipleActiveResultSets=true;Encrypt=False;TrustServerCertificate=True;");
            
            using var context = new AppDbContext(optionsBuilder.Options);
            var complaints = context.Complaints.Select(c => c.ComplaintNumber).ToList();
            Console.WriteLine($"Total Complaints in DB: {complaints.Count}");
            foreach(var c in complaints.Take(20))
            {
                Console.WriteLine($"- {c}");
            }
        }
    }

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<Complaint> Complaints { get; set; }
    }

    public class Complaint
    {
        public int Id { get; set; }
        public string ComplaintNumber { get; set; }
    }
}
