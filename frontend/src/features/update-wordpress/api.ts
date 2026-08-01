import { apiRequest } from "@/api/http";

import type {
  ConnectionSettings,
  ConnectResponse,
  FetchCurrentDatesResponse,
  PreviewResponse,
  UpdateRowResponse,
  WordPressCredentials,
} from "./types";

const updateWordpressPath = "/api/v1/update-wordpress";

export const updateWordpressSettingsQueryKey = ["update-wordpress", "settings"] as const;

export function fetchConnectionSettings(): Promise<ConnectionSettings> {
  return apiRequest<ConnectionSettings>(`${updateWordpressPath}/settings`, {
    cache: "no-store",
  });
}

export function connectWordPress(credentials: WordPressCredentials): Promise<ConnectResponse> {
  return apiRequest<ConnectResponse>(`${updateWordpressPath}/connect`, {
    method: "POST",
    body: JSON.stringify({
      wp_base_url: credentials.wpBaseUrl,
      wp_username: credentials.wpUsername,
      wp_app_password: credentials.wpAppPassword,
    }),
  });
}

export function previewCourseDates(inputFile: File): Promise<PreviewResponse> {
  const formData = new FormData();
  formData.append("input_file", inputFile);

  return apiRequest<PreviewResponse>(`${updateWordpressPath}/preview`, {
    method: "POST",
    body: formData,
  });
}

export function fetchCurrentCourseDates(input: {
  credentials: WordPressCredentials;
  permalink: string;
  slug: string;
  postId: number | null;
  excelDates: string[];
}): Promise<FetchCurrentDatesResponse> {
  return apiRequest<FetchCurrentDatesResponse>(`${updateWordpressPath}/fetch-current-dates`, {
    method: "POST",
    body: JSON.stringify({
      wp_base_url: input.credentials.wpBaseUrl,
      wp_username: input.credentials.wpUsername,
      wp_app_password: input.credentials.wpAppPassword,
      permalink: input.permalink,
      slug: input.slug,
      post_id: input.postId,
      excel_dates: input.excelDates,
    }),
  });
}

export function updateCourseRow(input: {
  credentials: WordPressCredentials;
  permalink: string;
  slug: string;
  postId: number | null;
  finalDates: string[];
}): Promise<UpdateRowResponse> {
  return apiRequest<UpdateRowResponse>(`${updateWordpressPath}/update-row`, {
    method: "POST",
    body: JSON.stringify({
      wp_base_url: input.credentials.wpBaseUrl,
      wp_username: input.credentials.wpUsername,
      wp_app_password: input.credentials.wpAppPassword,
      permalink: input.permalink,
      slug: input.slug,
      post_id: input.postId,
      final_dates: input.finalDates,
    }),
  });
}
