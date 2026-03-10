using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCategoryFromErrorOptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "ErrorDefinitionOptions");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 10, 29, 19, 910, DateTimeKind.Utc).AddTicks(8161), "$2a$11$MXBUP2U52ee3BHyUPVcFge3yT6d3AxOwlv5EKQrAmnfKN.7ApFLTC" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "ErrorDefinitionOptions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 1,
                column: "Category",
                value: "Mekanik");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 2,
                column: "Category",
                value: "Mekanik");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 3,
                column: "Category",
                value: "Görsel");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 4,
                column: "Category",
                value: "Mekanik");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 5,
                column: "Category",
                value: "Elektriksel");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 6,
                column: "Category",
                value: "Elektriksel");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 7,
                column: "Category",
                value: "Görsel");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 8,
                column: "Category",
                value: "Mekanik");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 9,
                column: "Category",
                value: "Hücre");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 10,
                column: "Category",
                value: "Görsel");

            migrationBuilder.UpdateData(
                table: "ErrorDefinitionOptions",
                keyColumn: "Id",
                keyValue: 11,
                column: "Category",
                value: "Elektriksel");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 10, 10, 49, 996, DateTimeKind.Utc).AddTicks(4190), "$2a$11$nhdOCFZp9ZfdfrDWCzQ1rOGvsb4DCEe40CIYKJ5Tz9WyVlAofLMAu" });
        }
    }
}
