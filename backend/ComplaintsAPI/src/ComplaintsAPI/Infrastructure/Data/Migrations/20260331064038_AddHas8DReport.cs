using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddHas8DReport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Has8DReport",
                table: "Complaints",
                type: "bit",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 31, 6, 40, 36, 816, DateTimeKind.Utc).AddTicks(1990), "$2a$11$Q41zggIHDhmRtHCdy1v40OcF0U1eb28j7BWKL2PniZRCCFBVozPCS" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Has8DReport",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 25, 12, 13, 9, 65, DateTimeKind.Utc).AddTicks(1404), "$2a$11$ToItfnyFkU2RIFPrxT4EIuGgXZ72erBYkySPG4w.ve4/GOXX8zi/." });
        }
    }
}
