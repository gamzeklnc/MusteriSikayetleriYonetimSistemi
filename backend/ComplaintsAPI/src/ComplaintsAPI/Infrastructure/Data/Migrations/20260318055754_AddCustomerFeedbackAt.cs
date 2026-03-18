using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerFeedbackAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CustomerFeedbackAt",
                table: "Complaints",
                type: "datetime2",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 18, 5, 57, 54, 66, DateTimeKind.Utc).AddTicks(9858), "$2a$11$LLW/2KGjcPzE7O0yVeBst.qlC2a1CkhjPNBra/92is605iKatGh.G" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerFeedbackAt",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 17, 7, 1, 29, 720, DateTimeKind.Utc).AddTicks(9381), "$2a$11$zX.xgdf0fiQqTT68G3CcSutNtCLSzJOi0Ump9Htt/enOPTgOodaxS" });
        }
    }
}
