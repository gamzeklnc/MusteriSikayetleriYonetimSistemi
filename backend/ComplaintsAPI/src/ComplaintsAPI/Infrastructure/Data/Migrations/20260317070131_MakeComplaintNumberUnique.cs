using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeComplaintNumberUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 17, 7, 1, 29, 720, DateTimeKind.Utc).AddTicks(9381), "$2a$11$zX.xgdf0fiQqTT68G3CcSutNtCLSzJOi0Ump9Htt/enOPTgOodaxS" });

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_ComplaintNumber",
                table: "Complaints",
                column: "ComplaintNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Complaints_ComplaintNumber",
                table: "Complaints");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 13, 7, 7, 48, 128, DateTimeKind.Utc).AddTicks(1611), "$2a$11$pyfwW9rmZ9w1su2iRmYPmuBfi5vt.0A8Kon8KnTvTjn831ik04jgm" });
        }
    }
}
