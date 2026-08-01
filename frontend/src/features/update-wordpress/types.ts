import type { components } from "@/api/generated";

export type ConnectionSettings = components["schemas"]["ConnectionSettings"];
export type ConnectResponse = components["schemas"]["ConnectResponse"];
export type SafeCourseDateRow = components["schemas"]["SafeCourseDateRow"];
export type PreviewResponse = components["schemas"]["PreviewResponse"];
export type FetchCurrentDatesResponse = components["schemas"]["FetchCurrentDatesResponse"];
export type UpdateRowResponse = components["schemas"]["UpdateRowResponse"];

export type WordPressCredentials = {
  wpBaseUrl: string;
  wpUsername: string;
  wpAppPassword: string;
};
