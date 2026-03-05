using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSellerNameAndInitialNote : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InitialNote",
                table: "Complaints",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SellerName",
                table: "Complaints",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 5, 8, 7, 37, 781, DateTimeKind.Utc).AddTicks(6498), "$2a$11$y2cFi9ZULNBROH5moQDsGOb7hQlMRjscvEyTL6wp3vbHvcyrANSku" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InitialNote",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "SellerName",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 5, 5, 41, 14, 751, DateTimeKind.Utc).AddTicks(2922), "$2a$11$dwbUqE7qrXfeZ0NZJvj02OiM190BgiWkl9WjraZUqTIKUyb0/XVL2" });
        }
    }
}
