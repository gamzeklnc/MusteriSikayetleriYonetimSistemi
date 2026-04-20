using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComplaintsAPI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class SplitProductionCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Hsa1Count",
                table: "ProductionCounts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Hsa2Count",
                table: "ProductionCounts",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Hsa1Count",
                table: "ProductionCounts");

            migrationBuilder.DropColumn(
                name: "Hsa2Count",
                table: "ProductionCounts");
        }
    }
}
