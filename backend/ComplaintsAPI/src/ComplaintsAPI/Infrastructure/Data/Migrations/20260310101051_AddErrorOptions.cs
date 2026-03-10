using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddErrorOptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ErrorDefinitionOptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ErrorDefinitionOptions", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ErrorDefinitionOptions",
                columns: new[] { "Id", "Category", "Label" },
                values: new object[,]
                {
                    { 1, "Mekanik", "Busbar Lehim Hatası" },
                    { 2, "Mekanik", "Cam Çiziği" },
                    { 3, "Görsel", "Cam Kirliliği" },
                    { 4, "Mekanik", "Çerçeve Köşe Açıklığı" },
                    { 5, "Elektriksel", "Diyot Hatası" },
                    { 6, "Elektriksel", "EL hatası" },
                    { 7, "Görsel", "Etiket Hatası" },
                    { 8, "Mekanik", "EVA Lekesi" },
                    { 9, "Hücre", "Finger Kırığı" },
                    { 10, "Görsel", "Gökkuşağı" },
                    { 11, "Elektriksel", "Güç Hatası" }
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 10, 10, 49, 996, DateTimeKind.Utc).AddTicks(4190), "$2a$11$nhdOCFZp9ZfdfrDWCzQ1rOGvsb4DCEe40CIYKJ5Tz9WyVlAofLMAu" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ErrorDefinitionOptions");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 8, 6, 26, 732, DateTimeKind.Utc).AddTicks(4556), "$2a$11$t5.AgqWelBUGRjaA2QzWeuL17S9tBAD4joJ/p27Ry2LHIMrQUz2PS" });
        }
    }
}
