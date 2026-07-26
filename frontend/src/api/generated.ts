/* eslint-disable */
/* This file is generated from the backend OpenAPI schema. Do not edit manually. */

export interface components {
  schemas: {
    AuthenticationSession: {
      authenticated: boolean;
      user: components["schemas"]["SessionUser"] | null;
    };
    CoreBootstrap: {
      authenticated: boolean;
      configuration: components["schemas"]["ShellConfiguration"];
      user: components["schemas"]["SessionUser"] | null;
      navigation: Array<components["schemas"]["NavigationItem"]>;
    };
    CoursePlanFile: {
      available: boolean;
      filename: string | null;
    };
    CoursePlanFiles: {
      excel: components["schemas"]["CoursePlanFile"];
      word: components["schemas"]["CoursePlanFile"];
      xml: components["schemas"]["CoursePlanFile"];
    };
    CoursePlanGeneration: {
      id: string;
      source_filename: string;
      year: number;
      months: Array<number>;
      randomness: number;
      course_count: number;
      created_at: string;
      created_by: string | null;
      files: components["schemas"]["CoursePlanFiles"];
    };
    CoursePlanHistoryResponse: {
      count: number;
      next: string | null;
      previous: string | null;
      results: Array<components["schemas"]["CoursePlanGeneration"]>;
    };
    CoursePlannerSettings: {
      year: number;
      months: Array<number>;
      randomness: number;
    };
    GenerateScheduleResponse: {
      schedule: Array<components["schemas"]["ScheduledCourse"]>;
      course_count: number;
      generation: components["schemas"]["CoursePlanGeneration"];
    };
    HealthResponse: {
      status: "ok" | "degraded";
      databases: Record<string, components["schemas"]["DatabaseHealth"]>;
    };
    DatabaseHealth: {
      alias: string;
      status: "ok" | "error" | "disabled";
    };
    InternalHolidayWrite: {
      date: string;
      local_name: string;
      description: string;
    };
    LoginRequest: {
      username: string;
      password: string;
    };
    NavigationItem: {
      key: string;
      label: string;
      path: string;
      icon: string;
      position: number;
      parent_key: string | null;
      application_key: string;
      is_separator: boolean;
    };
    PublicBranding: {
      site_name: string;
      organization_name: string;
      logo_url: string | null;
      culoare_primara: string;
      culoare_accent: string;
      culoare_fundal: string;
    };
    PublicHoliday: {
      id: string;
      date: string;
      local_name: string;
      english_name: string;
      description: string;
      source: "nager" | "internal";
      is_internal: boolean;
      created_at: string;
      updated_at: string;
    };
    PublicHolidaySettings: {
      enabled: boolean;
      automatic_sync: boolean;
      frequency: "1_month" | "6_months" | "1_year";
      last_attempted_at: string | null;
      last_successful_at: string | null;
      next_sync_at: string | null;
      last_status: "never" | "success" | "skipped" | "failed";
      last_error: string;
      last_accepted_count: number;
      last_created_count: number;
      last_updated_count: number;
      last_removed_count: number;
      sync_in_progress: boolean;
      updated_at: string;
    };
    PublicHolidaySettingsUpdate: {
      enabled: boolean;
      automatic_sync: boolean;
      frequency: "1_month" | "6_months" | "1_year";
    };
    ScheduledCourse: {
      title: string;
      permalink: string;
      duration_label: string;
      investment: string;
      date_range: string;
      month: number;
      original_order: number;
    };
    SessionUser: {
      id: number;
      username: string;
      display_name: string;
      email: string;
      is_staff: boolean;
      is_superuser: boolean;
    };
    ShellConfiguration: {
      site_name: string;
      organization_name: string;
      sidebar_title: string;
      logo_url: string | null;
      culoare_primara: string;
      culoare_accent: string;
      culoare_fundal: string;
    };
    SynchronizationResult: {
      status: "success" | "skipped" | "failed";
      message: string;
      accepted: number;
      created: number;
      updated: number;
      removed: number;
    };
    UserAccount: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      full_name: string;
      email: string;
      is_active: boolean;
      is_staff: boolean;
      is_superuser: boolean;
      date_joined: string;
      last_login: string | null;
    };
    UserListResponse: {
      count: number;
      next: string | null;
      previous: string | null;
      results: Array<components["schemas"]["UserAccount"]>;
    };
    UserWrite: {
      username: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      password?: string;
      is_active?: boolean;
      is_staff?: boolean;
    };
  };
}
