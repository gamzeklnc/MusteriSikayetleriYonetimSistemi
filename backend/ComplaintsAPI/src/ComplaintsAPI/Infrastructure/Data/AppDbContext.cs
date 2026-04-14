using Microsoft.EntityFrameworkCore;
using ComplaintsAPI.Domain.Entities;
using ComplaintsAPI.Domain.Enums;

namespace ComplaintsAPI.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Complaint> Complaints => Set<Complaint>();
    public DbSet<ComplaintHistory> ComplaintHistories => Set<ComplaintHistory>();
    public DbSet<ErrorDefinitionOption> ErrorDefinitionOptions => Set<ErrorDefinitionOption>();
    public DbSet<UserActivityLog> UserActivityLogs => Set<UserActivityLog>();
    public DbSet<ComplaintDocument> ComplaintDocuments => Set<ComplaintDocument>();
    public DbSet<ComplaintBarcodeResult> ComplaintBarcodeResults => Set<ComplaintBarcodeResult>();
    public DbSet<ProductionCount> ProductionCounts => Set<ProductionCount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ComplaintBarcodeResult
        modelBuilder.Entity<ComplaintBarcodeResult>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Complaint)
                  .WithMany(c => c.BarcodeResults)
                  .HasForeignKey(e => e.ComplaintId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(150);
            e.Property(x => x.Email).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.Email).IsUnique().HasFilter("[IsDeleted] = 0");
            e.Property(x => x.PasswordHash).IsRequired().HasMaxLength(500);
            e.Property(x => x.Role).HasConversion<string>();

            e.HasOne(x => x.Department)
             .WithMany(d => d.Users)
             .HasForeignKey(x => x.DepartmentId)
             .IsRequired(false).OnDelete(DeleteBehavior.SetNull);

            e.HasQueryFilter(x => !x.IsDeleted);
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
            e.Property(x => x.ComplaintNumber).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.ComplaintNumber).IsUnique();
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.RegistrationDate);
            e.HasIndex(x => x.ComplaintDate);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.CurrentDepartmentId);
            e.HasIndex(x => x.Brand);
            e.HasIndex(x => new { x.CurrentDepartmentId, x.Status });
            e.HasIndex(x => new { x.ComplaintDate, x.Brand });

            e.Property(x => x.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Acik");
            e.Property(x => x.CustomerName).IsRequired().HasMaxLength(200);
            e.Property(x => x.ProjectName).IsRequired().HasMaxLength(200);
            e.Property(x => x.ProjectLocation).IsRequired().HasMaxLength(100);
            e.Property(x => x.StockCode).IsRequired().HasMaxLength(100);
            e.Property(x => x.Brand).HasMaxLength(100);
            e.Property(x => x.ModulePower).HasMaxLength(50);
            e.Property(x => x.ErrorDefinition).HasColumnType("nvarchar(max)");
            e.Property(x => x.QualityReportNote).HasColumnType("nvarchar(max)");
            e.Property(x => x.IsQualityReported).HasDefaultValue(false);
            e.Property(x => x.ManagementApprovalNote).HasColumnType("nvarchar(max)");

            e.HasOne(x => x.CurrentDepartment)
             .WithMany(d => d.Complaints)
             .HasForeignKey(x => x.CurrentDepartmentId)
             .IsRequired(false).OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.CreatedBy)
             .WithMany(u => u.CreatedComplaints)
             .HasForeignKey(x => x.CreatedById)
             .IsRequired(false).OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.QualityReportedBy)
             .WithMany()
             .HasForeignKey(x => x.QualityReportedById)
             .IsRequired(false).OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.ManagementApprovedBy)
             .WithMany()
             .HasForeignKey(x => x.ManagementApprovedById)
             .IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });

        // ComplaintDocument
        modelBuilder.Entity<ComplaintDocument>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FileName).IsRequired().HasMaxLength(255);
            e.Property(x => x.FilePath).IsRequired().HasMaxLength(500);

            e.HasOne(x => x.Complaint)
             .WithMany(c => c.Documents)
             .HasForeignKey(x => x.ComplaintId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.UploadedBy)
             .WithMany()
             .HasForeignKey(x => x.UploadedById)
             .IsRequired(false).OnDelete(DeleteBehavior.SetNull);
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
             .IsRequired(false).OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.Department)
             .WithMany()
             .HasForeignKey(x => x.DepartmentId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // UserActivityLog
        modelBuilder.Entity<UserActivityLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UserFullName).IsRequired().HasMaxLength(150);
            e.Property(x => x.Action).IsRequired().HasMaxLength(150);

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.SetNull); // Keep the log if the user is deleted
        });

        // Seed Departments
        modelBuilder.Entity<Department>().HasData(
            new Department { Id = 1, Name = "Satış" },
            new Department { Id = 2, Name = "Kalite" },
            new Department { Id = 3, Name = "Kalite Güvence" },
            new Department { Id = 4, Name = "Yönetim" },
            new Department { Id = 5, Name = "IT" }
        );

        // ProductionCount
        modelBuilder.Entity<ProductionCount>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Year, x.Month }).IsUnique();
            e.Property(x => x.Count).IsRequired();
        });

        // Seed Error Options
        modelBuilder.Entity<ErrorDefinitionOption>().HasData(
            new ErrorDefinitionOption { Id = 1, Label = "Busbar Lehim Hatası" },
            new ErrorDefinitionOption { Id = 2, Label = "Cam Çiziği" },
            new ErrorDefinitionOption { Id = 3, Label = "Cam Kirliliği" },
            new ErrorDefinitionOption { Id = 4, Label = "Çerçeve Köşe Açıklığı" },
            new ErrorDefinitionOption { Id = 5, Label = "Diyot Hatası" },
            new ErrorDefinitionOption { Id = 6, Label = "EL hatası" },
            new ErrorDefinitionOption { Id = 7, Label = "Etiket Hatası" },
            new ErrorDefinitionOption { Id = 8, Label = "EVA Lekesi" },
            new ErrorDefinitionOption { Id = 9, Label = "Finger Kırığı" },
            new ErrorDefinitionOption { Id = 10, Label = "Gökkuşağı" },
            new ErrorDefinitionOption { Id = 11, Label = "Güç Hatası" }
        );

        // Seed Admin User (Password: admin123)
        modelBuilder.Entity<User>().HasData(
            new User 
            { 
                Id = 1, 
                Name = "Sistem Yöneticisi", 
                Email = "admin@sirket.com", 
                PasswordHash = "$2a$11$P3kNTepbQzw8ZluWSL4GyuF44YonfQkVEGdBdpjL7IQoS9EUwuzBa", 
                Role = UserRole.Admin, 
                DepartmentId = 5,
                CreatedAt = new DateTime(2026, 4, 13, 6, 54, 53, 504, DateTimeKind.Utc).AddTicks(1966)
            }
        );
    }
}
