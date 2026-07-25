import type { components } from "@/api/generated";

export type PublicHoliday = components["schemas"]["PublicHoliday"];
export type PublicHolidaySettings = components["schemas"]["PublicHolidaySettings"];
export type PublicHolidaySettingsUpdate = components["schemas"]["PublicHolidaySettingsUpdate"];
export type InternalHolidayInput = components["schemas"]["InternalHolidayWrite"];
export type SynchronizationResult = components["schemas"]["SynchronizationResult"];

export type PublicHolidaySource = NonNullable<PublicHoliday["source"]>;
export type PublicHolidayFrequency = NonNullable<PublicHolidaySettings["frequency"]>;
export type PublicHolidaySyncStatus = NonNullable<PublicHolidaySettings["last_status"]>;
