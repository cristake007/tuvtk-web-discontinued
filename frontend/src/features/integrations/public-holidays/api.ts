import { apiRequest } from "@/api/http";

import type {
  InternalHolidayInput,
  PublicHoliday,
  PublicHolidaySettings,
  PublicHolidaySettingsUpdate,
  SynchronizationResult,
} from "./types";

const basePath = "/api/v1/integrations/public-holidays";

export function fetchPublicHolidaySettings(): Promise<PublicHolidaySettings> {
  return apiRequest<PublicHolidaySettings>(`${basePath}/settings`);
}

export function updatePublicHolidaySettings(
  values: PublicHolidaySettingsUpdate,
): Promise<PublicHolidaySettings> {
  return apiRequest<PublicHolidaySettings>(`${basePath}/settings`, {
    method: "PUT",
    body: JSON.stringify(values),
  });
}

export function synchronizePublicHolidays(): Promise<SynchronizationResult> {
  return apiRequest<SynchronizationResult>(`${basePath}/sync`, {
    method: "POST",
  });
}

export function fetchPublicHolidays(year: number): Promise<PublicHoliday[]> {
  return apiRequest<PublicHoliday[]>(`${basePath}/holidays?year=${year}`);
}

export function createInternalHoliday(
  values: InternalHolidayInput,
): Promise<PublicHoliday> {
  return apiRequest<PublicHoliday>(`${basePath}/internal`, {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateInternalHoliday(
  holidayId: string,
  values: InternalHolidayInput,
): Promise<PublicHoliday> {
  return apiRequest<PublicHoliday>(`${basePath}/internal/${holidayId}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export function deleteInternalHoliday(holidayId: string): Promise<void> {
  return apiRequest<void>(`${basePath}/internal/${holidayId}`, {
    method: "DELETE",
  });
}
