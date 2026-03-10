using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameAdminDepartmentToIT : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 5,
                column: "Name",
                value: "IT");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 11, 51, 3, 285, DateTimeKind.Utc).AddTicks(138), "$2a$11$eU3sim5JUE2O/lzvlHYNQeKZft0SmZ4m75.YO5lRCet1Wo8xGqYDu" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 5,
                column: "Name",
                value: "Admin");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 10, 33, 25, 737, DateTimeKind.Utc).AddTicks(425), "$2a$11$PEuH8MfKgZLSOQa8bVRxwO0hBZn9t0Lz8gkC6QczFUFL.QlN1iQzO" });
        }
    }
}
