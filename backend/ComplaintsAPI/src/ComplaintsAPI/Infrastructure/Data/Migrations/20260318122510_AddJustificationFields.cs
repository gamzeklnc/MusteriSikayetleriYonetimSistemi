using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddJustificationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "JustifiedHsa1Count",
                table: "Complaints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "JustifiedHsa2Count",
                table: "Complaints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "JustifiedOtherCount",
                table: "Complaints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UnjustifiedHsa1Count",
                table: "Complaints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UnjustifiedHsa2Count",
                table: "Complaints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UnjustifiedOtherCount",
                table: "Complaints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ComplaintBarcodeResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ComplaintId = table.Column<int>(type: "int", nullable: false),
                    Barcode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsJustified = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComplaintBarcodeResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComplaintBarcodeResults_Complaints_ComplaintId",
                        column: x => x.ComplaintId,
                        principalTable: "Complaints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 18, 12, 25, 6, 634, DateTimeKind.Utc).AddTicks(7128), "$2a$11$uoFSn2vg0jO7ugDh6XTO9OBBXSXXzmVOrffoFnjo9SSaW4xKdRX9i" });

            migrationBuilder.CreateIndex(
                name: "IX_ComplaintBarcodeResults_ComplaintId",
                table: "ComplaintBarcodeResults",
                column: "ComplaintId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComplaintBarcodeResults");

            migrationBuilder.DropColumn(
                name: "JustifiedHsa1Count",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "JustifiedHsa2Count",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "JustifiedOtherCount",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "UnjustifiedHsa1Count",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "UnjustifiedHsa2Count",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "UnjustifiedOtherCount",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 18, 7, 26, 46, 815, DateTimeKind.Utc).AddTicks(6937), "$2a$11$Buv9RgjqWWRZZe1Isr3DVuwoYnbKLTnl6jYvcp.1XttIagP/xQWca" });
        }
    }
}
