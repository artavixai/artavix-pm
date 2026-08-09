using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Payvast.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitsToTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompletedUnits",
                table: "Tasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalUnits",
                table: "Tasks",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedUnits",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "TotalUnits",
                table: "Tasks");
        }
    }
}
