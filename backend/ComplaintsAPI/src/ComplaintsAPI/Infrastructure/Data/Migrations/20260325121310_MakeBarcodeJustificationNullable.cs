using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeBarcodeJustificationNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsJustified",
                table: "ComplaintBarcodeResults",
                type: "bit",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 25, 12, 13, 9, 65, DateTimeKind.Utc).AddTicks(1404), "$2a$11$ToItfnyFkU2RIFPrxT4EIuGgXZ72erBYkySPG4w.ve4/GOXX8zi/." });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsJustified",
                table: "ComplaintBarcodeResults",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 18, 12, 25, 6, 634, DateTimeKind.Utc).AddTicks(7128), "$2a$11$uoFSn2vg0jO7ugDh6XTO9OBBXSXXzmVOrffoFnjo9SSaW4xKdRX9i" });
        }
    }
}
