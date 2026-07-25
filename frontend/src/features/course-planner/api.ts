import { apiDownload, apiRequest } from "@/api/http";

import type {
  CoursePlanFileType,
  CoursePlanHistoryResponse,
  CoursePlannerInput,
  CoursePlannerSettings,
  GenerateScheduleResponse,
} from "./types";

const coursePlannerPath = "/api/v1/course-planner";

export const coursePlannerQueryKey = ["course-planner", "settings"] as const;
export const coursePlannerHistoryQueryKey = ["course-planner", "history"] as const;

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
  return apiDownload(
    `${coursePlannerPath}/history/${input.generationId}/files/${input.fileType}`,
  );
}

export function exportCourseSchedule(generationId: string): Promise<Blob> {
  return apiDownload(`${coursePlannerPath}/export`, {
    method: "POST",
    body: JSON.stringify({ generation_id: generationId }),
  });
}
