using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerFeedbackFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CustomerFeedbackById",
                table: "Complaints",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerFeedbackNote",
                table: "Complaints",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCustomerFeedbackDone",
                table: "Complaints",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 13, 7, 7, 48, 128, DateTimeKind.Utc).AddTicks(1611), "$2a$11$pyfwW9rmZ9w1su2iRmYPmuBfi5vt.0A8Kon8KnTvTjn831ik04jgm" });

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_CustomerFeedbackById",
                table: "Complaints",
                column: "CustomerFeedbackById");

            migrationBuilder.AddForeignKey(
                name: "FK_Complaints_Users_CustomerFeedbackById",
                table: "Complaints",
                column: "CustomerFeedbackById",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Complaints_Users_CustomerFeedbackById",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_CustomerFeedbackById",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "CustomerFeedbackById",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "CustomerFeedbackNote",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "IsCustomerFeedbackDone",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 11, 11, 28, 6, 550, DateTimeKind.Utc).AddTicks(2045), "$2a$11$F.06r.9UiraNcyY8JOc8ReWxrGokDbIXGHIVnaXO8xiH/zxw5JsK2" });
        }
    }
}
