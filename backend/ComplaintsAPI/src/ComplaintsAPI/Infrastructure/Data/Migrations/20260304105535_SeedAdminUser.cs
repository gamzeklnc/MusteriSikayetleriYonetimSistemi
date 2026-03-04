using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedAdminUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "DepartmentId", "Email", "Name", "PasswordHash", "Role" },
                values: new object[] { 1, new DateTime(2026, 3, 4, 10, 55, 34, 226, DateTimeKind.Utc).AddTicks(1696), 5, "admin@sirket.com", "Sistem Yöneticisi", "$2a$11$4rVbZ.sUjQZZs1B17XQLleWqCsx11QR/tCoE9XDZDn4dynwHWNfrm", "Admin" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);
        }
    }
}
