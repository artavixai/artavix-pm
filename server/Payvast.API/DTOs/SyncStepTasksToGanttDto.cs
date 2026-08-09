using System;
using System.Collections.Generic;

namespace Payvast.API.DTOs
{
    public class SyncStepTasksToGanttDto
    {
        public int ProjectId { get; set; }
        public List<StepTaskSyncItem> Tasks { get; set; } = new List<StepTaskSyncItem>();
    }

    public class StepTaskSyncItem
    {
        public int StepTaskId { get; set; }        // Id تسک مرحله (از جدول Tasks)
        public string Title { get; set; }          // عنوان تسک
        public DateTime SessionDate { get; set; }  // تاریخ جلسه (UTC)
        public int? AssigneeId { get; set; }       // کارشناس
        public bool IsCompleted { get; set; }      // آیا انجام شده؟
        public int? StepId { get; set; }           // Id مرحله (اختیاری)
    }
}