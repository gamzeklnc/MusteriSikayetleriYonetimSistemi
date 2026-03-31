using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTargetDateToComplaint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasTargetDate",
                table: "Complaints",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TargetDate",
                table: "Complaints",
                type: "datetime2",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 31, 10, 41, 55, 924, DateTimeKind.Utc).AddTicks(2421), "$2a$11$zA8FgbGcFlURg/gu3mOwQuGYkdieZl0k3Oko/vTtsjA2eU42SmalK" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasTargetDate",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "TargetDate",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 31, 8, 39, 13, 49, DateTimeKind.Utc).AddTicks(5637), "$2a$11$VZhLQBgSOrvKDWCeKRTCmuBVw3q8xTZyAjivz1S5WXDmiSF1rgpEq" });
        }
    }
}
