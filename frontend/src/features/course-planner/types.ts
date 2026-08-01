import type { components } from "@/api/generated";

export type CoursePlannerSettings = components["schemas"]["CoursePlannerSettings"];
export type ScheduledCourse = components["schemas"]["ScheduledCourse"];
export type CoursePlanFile = components["schemas"]["CoursePlanFile"];
export type CoursePlanGeneration = components["schemas"]["CoursePlanGeneration"];
export type CoursePlanHistoryResponse = components["schemas"]["CoursePlanHistoryResponse"];
export type GenerateScheduleResponse = components["schemas"]["GenerateScheduleResponse"];

export type CoursePlanFileType = "excel" | "word" | "xml";

export type CoursePlannerInput = CoursePlannerSettings & {
  inputFile: File;
};

export type CoursePlannerHoliday = {
  date: string;
  name: string;
  source_label: string;
};

export type WordMatchPreviewResponse = components["schemas"]["WordMatchPreviewResponse"];
export type WordMatchRow = components["schemas"]["WordMatchRow"];
export type WordMatchCandidate = components["schemas"]["WordMatchCandidate"];
export type WordMatchScheduleOption = components["schemas"]["WordMatchScheduleOption"];
export type WordMatchAssignment = components["schemas"]["WordMatchAssignment"];
