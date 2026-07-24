import { apiDownload, apiRequest, ensureCsrfCookie } from "@/api/http";

import type {
  CoursePlanFileType,
  CoursePlanHistoryResponse,
  CoursePlannerInput,
  CoursePlannerSettings,
  GenerateScheduleResponse,
  ScheduledCourse,
} from "./types";

const coursePlannerPath = "/api/v1/course-planner";

const fileAcceptTypes: Record<CoursePlanFileType, string> = {
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xml: "application/xml",
};

export const coursePlannerQueryKey = ["course-planner", "settings"] as const;
export const coursePlannerHistoryQueryKey = ["course-planner", "history"] as const;

export function fetchCoursePlannerSettings(): Promise<CoursePlannerSettings> {
  return apiRequest<CoursePlannerSettings>(`${coursePlannerPath}/settings`, {
    cache: "no-store",
  });
}

export async function saveCoursePlannerSettings(
  settings: CoursePlannerSettings,
): Promise<CoursePlannerSettings> {
  await ensureCsrfCookie();
  return apiRequest<CoursePlannerSettings>(`${coursePlannerPath}/settings`, {
    method: "PUT",
    body: JSON.stringify(settings),
    includeCsrf: true,
  });
}

export async function generateCourseSchedule(
  input: CoursePlannerInput,
): Promise<GenerateScheduleResponse> {
  await ensureCsrfCookie();
  const formData = new FormData();
  formData.append("input_file", input.inputFile);
  formData.append("year", String(input.year));
  formData.append("months", input.months.join(","));
  formData.append("randomness", String(input.randomness));
  formData.append("holidays", input.holidays.join(","));

  return apiRequest<GenerateScheduleResponse>(`${coursePlannerPath}/generate`, {
    method: "POST",
    body: formData,
    includeCsrf: true,
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
  return apiDownload(
    `${coursePlannerPath}/history/${input.generationId}/files/${input.fileType}`,
    { accept: fileAcceptTypes[input.fileType] },
  );
}

export async function exportCourseSchedule(input: {
  year: number;
  holidays: string[];
  schedule: ScheduledCourse[];
}): Promise<Blob> {
  await ensureCsrfCookie();
  return apiDownload(`${coursePlannerPath}/export`, {
    method: "POST",
    body: JSON.stringify(input),
    includeCsrf: true,
    accept: fileAcceptTypes.excel,
  });
}
