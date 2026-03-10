using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddManagementApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsManagementApproved",
                table: "Complaints",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManagementApprovalNote",
                table: "Complaints",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ManagementApprovedById",
                table: "Complaints",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QualityReportedById",
                table: "Complaints",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 8, 6, 26, 732, DateTimeKind.Utc).AddTicks(4556), "$2a$11$t5.AgqWelBUGRjaA2QzWeuL17S9tBAD4joJ/p27Ry2LHIMrQUz2PS" });

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_ManagementApprovedById",
                table: "Complaints",
                column: "ManagementApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_QualityReportedById",
                table: "Complaints",
                column: "QualityReportedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Complaints_Users_ManagementApprovedById",
                table: "Complaints",
                column: "ManagementApprovedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Complaints_Users_QualityReportedById",
                table: "Complaints",
                column: "QualityReportedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Complaints_Users_ManagementApprovedById",
                table: "Complaints");

            migrationBuilder.DropForeignKey(
                name: "FK_Complaints_Users_QualityReportedById",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_ManagementApprovedById",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_QualityReportedById",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "IsManagementApproved",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "ManagementApprovalNote",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "ManagementApprovedById",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "QualityReportedById",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 10, 6, 36, 24, 240, DateTimeKind.Utc).AddTicks(3734), "$2a$11$cgVfaT/s2CbOaIMvxXQq4uDmm8ZOYIP/c.UCNwjYsiT4RoCncGM1S" });
        }
    }
}
