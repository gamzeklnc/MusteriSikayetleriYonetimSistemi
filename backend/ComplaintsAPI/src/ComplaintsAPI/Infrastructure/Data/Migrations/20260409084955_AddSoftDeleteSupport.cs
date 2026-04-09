using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "IsDeleted", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 9, 8, 49, 53, 776, DateTimeKind.Utc).AddTicks(7704), false, "$2a$11$LNCxbpkxA78sSvbvzacOn.ObQgjbvONj1Y6XIiQabruEVTGrRn7gu" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 31, 10, 41, 55, 924, DateTimeKind.Utc).AddTicks(2421), "$2a$11$zA8FgbGcFlURg/gu3mOwQuGYkdieZl0k3Oko/vTtsjA2eU42SmalK" });
        }
    }
}
