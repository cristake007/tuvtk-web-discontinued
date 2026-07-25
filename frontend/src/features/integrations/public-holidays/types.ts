import type { components } from "@/api/generated";

export type PublicHoliday = components["schemas"]["PublicHoliday"];
export type PublicHolidaySettings = components["schemas"]["PublicHolidaySettings"];
export type PublicHolidaySettingsUpdate = components["schemas"]["PublicHolidaySettingsUpdate"];
export type InternalHolidayInput = components["schemas"]["InternalHolidayInput"];
export type SynchronizationResult = components["schemas"]["SynchronizationResult"];

export type PublicHolidaySource = PublicHoliday["source"];
export type PublicHolidayFrequency = PublicHolidaySettings["frequency"];
export type PublicHolidaySyncStatus = PublicHolidaySettings["last_status"];
