export type PublicHolidaySource = "nager" | "internal";
export type PublicHolidayFrequency = "1_month" | "6_months" | "1_year";
export type PublicHolidaySyncStatus = "never" | "success" | "skipped" | "failed";

export type PublicHoliday = {
  id: string;
  date: string;
  local_name: string;
  english_name: string;
  description: string;
  source: PublicHolidaySource;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicHolidaySettings = {
  enabled: boolean;
  automatic_sync: boolean;
  frequency: PublicHolidayFrequency;
  last_attempted_at: string | null;
  last_successful_at: string | null;
  next_sync_at: string | null;
  last_status: PublicHolidaySyncStatus;
  last_error: string;
  last_accepted_count: number;
  last_created_count: number;
  last_updated_count: number;
  last_removed_count: number;
  sync_in_progress: boolean;
  updated_at: string;
};

export type PublicHolidaySettingsUpdate = Pick<
  PublicHolidaySettings,
  "enabled" | "automatic_sync" | "frequency"
>;

export type InternalHolidayInput = {
  date: string;
  local_name: string;
  description: string;
};

export type SynchronizationResult = {
  status: "success" | "skipped" | "failed";
  message: string;
  accepted: number;
  created: number;
  updated: number;
  removed: number;
};
