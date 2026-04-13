using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUploadedAtStageToDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UploadedAtStage",
                table: "ComplaintDocuments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 13, 6, 54, 53, 504, DateTimeKind.Utc).AddTicks(1966), "$2a$11$P3kNTepbQzw8ZluWSL4GyuF44YonfQkVEGdBdpjL7IQoS9EUwuzBa" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UploadedAtStage",
                table: "ComplaintDocuments");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 13, 6, 42, 49, 574, DateTimeKind.Utc).AddTicks(3469), "$2a$11$dmqXNn5c4DPzjgyNRhffOe7MjhT.66KxrIeCvLbndPdp5CRmBCGGO" });
        }
    }
}
