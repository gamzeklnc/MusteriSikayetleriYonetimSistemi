using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Domain.Entities;

namespace ComplaintsAPI.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Complaint> Complaints => Set<Complaint>();
    public DbSet<ComplaintHistory> ComplaintHistories => Set<ComplaintHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(150);
            e.Property(x => x.Email).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.PasswordHash).IsRequired().HasMaxLength(500);
            e.Property(x => x.Role).HasConversion<string>();

            e.HasOne(x => x.Department)
             .WithMany(d => d.Users)
             .HasForeignKey(x => x.DepartmentId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Department
        modelBuilder.Entity<Department>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
        });

        // Complaint
        modelBuilder.Entity<Complaint>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Acik");
            e.Property(x => x.CustomerName).IsRequired().HasMaxLength(200);
            e.Property(x => x.ProjectName).IsRequired().HasMaxLength(200);
            e.Property(x => x.ProjectLocation).IsRequired().HasMaxLength(100);
            e.Property(x => x.StockCode).IsRequired().HasMaxLength(100);
            e.Property(x => x.Brand).HasMaxLength(100);
            e.Property(x => x.ModulePower).HasMaxLength(50);
            e.Property(x => x.ErrorDefinition).HasColumnType("nvarchar(max)");

            e.HasOne(x => x.CurrentDepartment)
             .WithMany(d => d.Complaints)
             .HasForeignKey(x => x.CurrentDepartmentId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.CreatedBy)
             .WithMany(u => u.CreatedComplaints)
             .HasForeignKey(x => x.CreatedById)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ComplaintHistory
        modelBuilder.Entity<ComplaintHistory>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Note).HasColumnType("nvarchar(max)");

            e.HasOne(x => x.Complaint)
             .WithMany(c => c.History)
             .HasForeignKey(x => x.ComplaintId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.ChangedBy)
             .WithMany(u => u.ComplaintHistories)
             .HasForeignKey(x => x.ChangedById)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Department)
             .WithMany()
             .HasForeignKey(x => x.DepartmentId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // Seed Departments
        modelBuilder.Entity<Department>().HasData(
            new Department { Id = 1, Name = "Satış" },
            new Department { Id = 2, Name = "Kalite" },
            new Department { Id = 3, Name = "Kalite Güvence" },
            new Department { Id = 4, Name = "Yönetim" },
            new Department { Id = 5, Name = "Admin" }
        );
    }
}
