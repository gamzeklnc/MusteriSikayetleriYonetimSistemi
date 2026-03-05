using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBarcodesToComplaint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Barcodes",
                table: "Complaints",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 5, 5, 41, 14, 751, DateTimeKind.Utc).AddTicks(2922), "$2a$11$dwbUqE7qrXfeZ0NZJvj02OiM190BgiWkl9WjraZUqTIKUyb0/XVL2" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Barcodes",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 4, 13, 56, 40, 797, DateTimeKind.Utc).AddTicks(1422), "$2a$11$J2.9A181GZ0qvYR.HtttT.ziOXbRlWsiJu6SkOoKnAx2gRo/N/btG" });
        }
    }
}
