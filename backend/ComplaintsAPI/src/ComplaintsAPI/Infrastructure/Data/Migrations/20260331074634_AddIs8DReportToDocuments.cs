using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIs8DReportToDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Is8DReport",
                table: "ComplaintDocuments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 31, 7, 46, 33, 623, DateTimeKind.Utc).AddTicks(6254), "$2a$11$KGq8oOMoOHGp4fJGaqQIo.z.npAZBP2f3mg7GsCbgk6GW1Rfrld5W" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Is8DReport",
                table: "ComplaintDocuments");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 31, 6, 40, 36, 816, DateTimeKind.Utc).AddTicks(1990), "$2a$11$Q41zggIHDhmRtHCdy1v40OcF0U1eb28j7BWKL2PniZRCCFBVozPCS" });
        }
    }
}
