import { apiDownload, apiRequest } from "@/api/http";

import type {
  CoursePlanFileType,
  CoursePlanHistoryResponse,
  CoursePlannerHoliday,
  CoursePlannerInput,
  CoursePlannerSettings,
  GenerateScheduleResponse,
  WordMatchAssignment,
  WordMatchPreviewResponse,
  WordMatchScheduleOption,
} from "./types";

const coursePlannerPath = "/api/v1/course-planner";

export const coursePlannerQueryKey = ["course-planner", "settings"] as const;
export const coursePlannerHistoryQueryKey = ["course-planner", "history"] as const;

export function coursePlannerHolidaysQueryKey(year: number, months: number[]) {
  return ["course-planner", "holidays", year, ...months] as const;
}

export function fetchCoursePlannerSettings(): Promise<CoursePlannerSettings> {
  return apiRequest<CoursePlannerSettings>(`${coursePlannerPath}/settings`, {
    cache: "no-store",
  });
}

export function saveCoursePlannerSettings(
  settings: CoursePlannerSettings,
): Promise<CoursePlannerSettings> {
  return apiRequest<CoursePlannerSettings>(`${coursePlannerPath}/settings`, {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export function fetchCoursePlannerHolidays(
  year: number,
  months: number[],
): Promise<CoursePlannerHoliday[]> {
  const search = new URLSearchParams({
    year: String(year),
    months: months.join(","),
  });
  return apiRequest<CoursePlannerHoliday[]>(`${coursePlannerPath}/holidays?${search}`, {
    cache: "no-store",
  });
}

export function generateCourseSchedule(
  input: CoursePlannerInput,
): Promise<GenerateScheduleResponse> {
  const formData = new FormData();
  formData.append("input_file", input.inputFile);
  formData.append("year", String(input.year));
  formData.append("months", input.months.join(","));
  formData.append("randomness", String(input.randomness));

  return apiRequest<GenerateScheduleResponse>(`${coursePlannerPath}/generate`, {
    method: "POST",
    body: formData,
  });
}

export function fetchCoursePlanHistory(page: number): Promise<CoursePlanHistoryResponse> {
  const search = new URLSearchParams({ page: String(page), page_size: "25" });
  return apiRequest<CoursePlanHistoryResponse>(`${coursePlannerPath}/history?${search}`, {
    cache: "no-store",
  });
}

export function downloadCoursePlanFile(input: {
  generationId: string;
  fileType: CoursePlanFileType;
}): Promise<Blob> {
  return apiDownload(`${coursePlannerPath}/history/${input.generationId}/files/${input.fileType}`);
}

export function exportCourseSchedule(generationId: string): Promise<Blob> {
  return apiDownload(`${coursePlannerPath}/export`, {
    method: "POST",
    body: JSON.stringify({ generation_id: generationId }),
  });
}

export function formatXmlSchedule(inputFile: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("input_file", inputFile);

  return apiDownload(`${coursePlannerPath}/format-xml`, {
    method: "POST",
    body: formData,
  });
}

export function previewWordMatch(input: {
  wordFile: File;
  scheduleFile: File;
}): Promise<WordMatchPreviewResponse> {
  const formData = new FormData();
  formData.append("word_file", input.wordFile);
  formData.append("schedule_file", input.scheduleFile);

  return apiRequest<WordMatchPreviewResponse>(`${coursePlannerPath}/word-match/preview`, {
    method: "POST",
    body: formData,
  });
}

export function generateWordMatch(input: {
  wordFileB64: string;
  scheduleOptions: WordMatchScheduleOption[];
  matches: WordMatchAssignment[];
}): Promise<Blob> {
  return apiDownload(`${coursePlannerPath}/word-match/generate`, {
    method: "POST",
    body: JSON.stringify({
      word_file_b64: input.wordFileB64,
      schedule_options: input.scheduleOptions,
      matches: input.matches,
    }),
  });
}
