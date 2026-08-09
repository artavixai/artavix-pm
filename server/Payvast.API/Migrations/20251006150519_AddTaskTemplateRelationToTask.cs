using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Payvast.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskTemplateRelationToTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TaskTemplateId",
                table: "Tasks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_TaskTemplateId",
                table: "Tasks",
                column: "TaskTemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_TaskTemplates_TaskTemplateId",
                table: "Tasks",
                column: "TaskTemplateId",
                principalTable: "TaskTemplates",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_TaskTemplates_TaskTemplateId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_TaskTemplateId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "TaskTemplateId",
                table: "Tasks");
        }
    }
}
