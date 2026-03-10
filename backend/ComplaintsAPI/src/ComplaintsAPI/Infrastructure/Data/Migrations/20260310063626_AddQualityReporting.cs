using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddQualityReporting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsQualityReported",
                table: "Complaints",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "QualityReportNote",
                table: "Complaints",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 6, 36, 24, 240, DateTimeKind.Utc).AddTicks(3734), "$2a$11$cgVfaT/s2CbOaIMvxXQq4uDmm8ZOYIP/c.UCNwjYsiT4RoCncGM1S" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsQualityReported",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "QualityReportNote",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 5, 8, 7, 37, 781, DateTimeKind.Utc).AddTicks(6498), "$2a$11$y2cFi9ZULNBROH5moQDsGOb7hQlMRjscvEyTL6wp3vbHvcyrANSku" });
        }
    }
}
