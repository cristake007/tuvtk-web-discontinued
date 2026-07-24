import { apiDownload, apiRequest, ensureCsrfCookie } from "@/api/http";

import type {
  CoursePlannerInput,
  CoursePlannerSettings,
  GenerateScheduleResponse,
  ScheduledCourse,
} from "./types";

const coursePlannerPath = "/api/v1/course-planner";

export const coursePlannerQueryKey = ["course-planner", "settings"] as const;

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
  });
}
