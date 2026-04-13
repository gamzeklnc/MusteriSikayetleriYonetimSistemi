using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddComplaintPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Complaints_Brand",
                table: "Complaints",
                column: "Brand");

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_ComplaintDate",
                table: "Complaints",
                column: "ComplaintDate");

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_ComplaintDate_Brand",
                table: "Complaints",
                columns: new[] { "ComplaintDate", "Brand" });

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_CreatedAt",
                table: "Complaints",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_CurrentDepartmentId_Status",
                table: "Complaints",
                columns: new[] { "CurrentDepartmentId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_RegistrationDate",
                table: "Complaints",
                column: "RegistrationDate");

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_Status",
                table: "Complaints",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Complaints_Brand",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_ComplaintDate",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_ComplaintDate_Brand",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_CreatedAt",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_CurrentDepartmentId_Status",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_RegistrationDate",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_Status",
                table: "Complaints");

        }
    }
}
