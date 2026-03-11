using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateObsoleteUserRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Users SET Role = 'User' WHERE Role IN ('Manager', 'Agent')");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 11, 11, 28, 6, 550, DateTimeKind.Utc).AddTicks(2045), "$2a$11$F.06r.9UiraNcyY8JOc8ReWxrGokDbIXGHIVnaXO8xiH/zxw5JsK2" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 11, 51, 3, 285, DateTimeKind.Utc).AddTicks(138), "$2a$11$eU3sim5JUE2O/lzvlHYNQeKZft0SmZ4m75.YO5lRCet1Wo8xGqYDu" });
        }
    }
}
