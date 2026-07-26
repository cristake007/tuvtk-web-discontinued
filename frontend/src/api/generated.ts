/* eslint-disable */
/* This file is generated from the backend OpenAPI schema. Do not edit manually. */

export interface components {
  schemas: {
    "ApiError": {
      "code": string;
      "detail": string;
      "fields": {
        [key: string]: unknown;
      };
    };
    "ApplicationAccess": {
      "id": number;
      "key": string;
      "name": string;
    };
    "ApplicationGroup": {
      "id": number;
      "name": string;
      "applications": Array<components["schemas"]["GroupApplication"]>;
      "users": Array<components["schemas"]["GroupUser"]>;
    };
    "ApplicationGroupWrite": components["schemas"]["ApplicationGroupWriteRequest"];
    "ApplicationGroupWriteRequest": {
      "name": string;
      "application_ids"?: Array<number>;
      "user_ids"?: Array<number>;
    };
    "AuthenticationEndpoints": {
      "csrf": string;
      "session": string;
      "login": string;
      "logout": string;
    };
    "AuthenticationSession": {
      "authenticated": boolean;
      "user": components["schemas"]["SessionUser"] | null;
    };
    "AvailableApplication": {
      "id": number;
      "key": string;
      "name": string;
    };
    "CompanyLogoUpload": components["schemas"]["CompanyLogoUploadRequest"];
    "CompanyLogoUploadRequest": {
      "logo": string;
    };
    "CoreBootstrap": {
      "authenticated": boolean;
      "configuration": components["schemas"]["ShellConfiguration"];
      "user": components["schemas"]["SessionUser"] | null;
      "navigation": Array<components["schemas"]["NavigationItem"]>;
      "accessible_application_keys": Array<string>;
    };
    "CoursePlanFile": {
      "available": boolean;
      "filename": string | null;
    };
    "CoursePlanFiles": {
      "excel": components["schemas"]["CoursePlanFile"];
      "word": components["schemas"]["CoursePlanFile"];
      "xml": components["schemas"]["CoursePlanFile"];
    };
    "CoursePlanGeneration": {
      "id": string;
      "source_filename": string;
      "year": number;
      "months": Array<number>;
      "randomness": number;
      "course_count": number;
      "created_at": string;
      "created_by": string | null;
      "files": components["schemas"]["CoursePlanFiles"];
    };
    "CoursePlanHistoryResponse": {
      "count": number;
      "next": string | null;
      "previous": string | null;
      "results": Array<components["schemas"]["CoursePlanGeneration"]>;
    };
    "CoursePlannerErrorDetail": {
      "code": string;
      "detail": string;
      "fields": {
        [key: string]: unknown;
      };
    };
    "CoursePlannerHoliday": {
      "date": string;
      "name": string;
      "source_label": string;
    };
    "CoursePlannerSettings": {
      "year": number;
      "months": Array<number>;
      "randomness": number;
    };
    "CoursePlannerSettingsRequest": {
      "year": number;
      "months": Array<number>;
      "randomness": number;
    };
    "DatabaseHealth": {
      "alias": string;
      "status": components["schemas"]["DatabaseHealthStatusEnum"];
    };
    "DatabaseHealthStatusEnum": "ok" | "error" | "disabled";
    "ErrorDetail": {
      "code": string;
      "detail": string;
      "fields": {
        [key: string]: unknown;
      };
    };
    "ExportSchedule": components["schemas"]["ExportScheduleRequest"];
    "ExportScheduleRequest": {
      "generation_id": string;
    };
    "FrequencyEnum": "1_month" | "6_months" | "1_year";
    "GenerateSchedule": components["schemas"]["GenerateScheduleRequest"];
    "GenerateScheduleRequest": {
      "input_file": string;
      "year": number;
      "months": string;
      "randomness": number;
    };
    "GenerateScheduleResponse": {
      "schedule": Array<components["schemas"]["ScheduledCourse"]>;
      "course_count": number;
      "generation": components["schemas"]["CoursePlanGeneration"];
    };
    "GroupApplication": {
      "id": number;
      "key": string;
      "name": string;
    };
    "GroupSummary": {
      "id": number;
      "name": string;
    };
    "GroupUser": {
      "id": number;
      "username": string;
      "full_name": string;
      "is_active": boolean;
    };
    "HealthDatabases": {
      "core": components["schemas"]["DatabaseHealth"];
      "registry": components["schemas"]["DatabaseHealth"];
    };
    "HealthResponse": {
      "status": components["schemas"]["HealthResponseStatusEnum"];
      "databases": components["schemas"]["HealthDatabases"];
    };
    "HealthResponseStatusEnum": "ok" | "degraded";
    "InternalHolidayWrite": components["schemas"]["InternalHolidayWriteRequest"];
    "InternalHolidayWriteRequest": {
      "date": string;
      "local_name": string;
      "description"?: string;
    };
    "LastStatusEnum": "never" | "success" | "skipped" | "failed";
    "LoginRequest": components["schemas"]["LoginRequestRequest"];
    "LoginRequestRequest": {
      "username": string;
      "password": string;
    };
    "NavigationItem": {
      "key": string;
      "label": string;
      "path": string;
      "icon": string;
      "position": number;
      "parent_key": string | null;
      "application_key": string;
      "is_separator": boolean;
    };
    "NavigationItemRequest": {
      "key": string;
      "label": string;
      "path": string;
      "icon": string;
      "position": number;
      "parent_key": string | null;
      "application_key": string;
      "is_separator": boolean;
    };
    "OrdineMeniu": components["schemas"]["OrdineMeniuRequest"];
    "OrdineMeniuRequest": {
      "chei": Array<string>;
    };
    "PatchedActualizareInterfataUtilizator": components["schemas"]["PatchedActualizareInterfataUtilizatorRequest"];
    "PatchedActualizareInterfataUtilizatorRequest": {
      "site_name"?: string;
      "culoare_primara"?: string;
      "culoare_accent"?: string;
      "culoare_fundal"?: string;
    };
    "PatchedApplicationGroupWrite": components["schemas"]["PatchedApplicationGroupWriteRequest"];
    "PatchedApplicationGroupWriteRequest": {
      "name"?: string;
      "application_ids"?: Array<number>;
      "user_ids"?: Array<number>;
    };
    "PatchedInternalHolidayWrite": components["schemas"]["PatchedInternalHolidayWriteRequest"];
    "PatchedInternalHolidayWriteRequest": {
      "date"?: string;
      "local_name"?: string;
      "description"?: string;
    };
    "PatchedUserWrite": components["schemas"]["PatchedUserWriteRequest"];
    "PatchedUserWriteRequest": {
      "username"?: string;
      "first_name"?: string;
      "last_name"?: string;
      "email"?: string | string;
      "password"?: string;
      "is_active"?: boolean;
      "is_staff"?: boolean;
      "group_ids"?: Array<number>;
      "direct_application_ids"?: Array<number>;
    };
    "PublicBranding": {
      "site_name": string;
      "organization_name": string;
      "logo_url": string | null;
      "culoare_primara": string;
      "culoare_accent": string;
      "culoare_fundal": string;
    };
    "PublicHoliday": {
      "id": string;
      "date": string;
      "local_name": string;
      "english_name"?: string;
      "description"?: string;
      "source": components["schemas"]["SourceEnum"];
      "is_internal"?: boolean;
      "created_at": string;
      "updated_at": string;
    };
    "PublicHolidayErrorDetail": {
      "code": string;
      "detail": string;
      "fields": {
        [key: string]: unknown;
      };
    };
    "PublicHolidaySettings": {
      "enabled": boolean;
      "automatic_sync": boolean;
      "frequency": components["schemas"]["FrequencyEnum"];
      "last_attempted_at": string | null;
      "last_successful_at": string | null;
      "next_sync_at": string | null;
      "last_status": components["schemas"]["LastStatusEnum"];
      "last_error": string;
      "last_accepted_count": number;
      "last_created_count": number;
      "last_updated_count": number;
      "last_removed_count": number;
      "sync_in_progress": boolean;
      "updated_at": string;
    };
    "PublicHolidaySettingsUpdate": components["schemas"]["PublicHolidaySettingsUpdateRequest"];
    "PublicHolidaySettingsUpdateRequest": {
      "enabled": boolean;
      "automatic_sync": boolean;
      "frequency": components["schemas"]["FrequencyEnum"];
    };
    "RezumatDocumente": {
      "titlu": string;
      "descriere": string;
      "documente": Array<{
        [key: string]: unknown;
      }>;
    };
    "RezumatTablouDeBord": {
      "titlu": string;
      "descriere": string;
      "module": Array<{
        [key: string]: unknown;
      }>;
    };
    "ScheduledCourse": {
      "title": string;
      "permalink": string;
      "duration_label": string;
      "investment": string;
      "date_range": string;
      "month": number;
      "original_order": number;
    };
    "SessionUser": {
      "id": number;
      "username": string;
      "display_name": string;
      "email": string | string;
      "is_staff": boolean;
      "is_superuser": boolean;
    };
    "ShellConfiguration": {
      "site_name": string;
      "organization_name": string;
      "sidebar_title": string;
      "logo_url": string | null;
      "culoare_primara": string;
      "culoare_accent": string;
      "culoare_fundal": string;
    };
    "SourceEnum": "nager" | "internal";
    "SynchronizationResult": {
      "status": components["schemas"]["SynchronizationResultStatusEnum"];
      "message": string;
      "accepted": number;
      "created": number;
      "updated": number;
      "removed": number;
    };
    "SynchronizationResultStatusEnum": "success" | "skipped" | "failed";
    "UnscheduledCourseFields": {
      "unscheduled_courses": {
        [key: string]: Array<string>;
      };
    };
    "UnscheduledCourses": {
      "code": string;
      "detail": string;
      "fields": components["schemas"]["UnscheduledCourseFields"];
    };
    "UserAccount": {
      "id": number;
      "username": string;
      "first_name": string;
      "last_name": string;
      "full_name": string;
      "email": string | string;
      "is_active": boolean;
      "is_staff": boolean;
      "is_superuser": boolean;
      "date_joined": string;
      "last_login": string | null;
      "groups": Array<components["schemas"]["GroupSummary"]>;
      "direct_applications": Array<components["schemas"]["ApplicationAccess"]>;
      "inherited_applications": Array<components["schemas"]["ApplicationAccess"]>;
      "effective_applications": Array<components["schemas"]["ApplicationAccess"]>;
    };
    "UserListResponse": {
      "count": number;
      "next": string | null;
      "previous": string | null;
      "results": Array<components["schemas"]["UserAccount"]>;
    };
    "UserSelection": {
      "id": number;
      "username": string;
      "full_name": string;
      "email"?: string | string;
      "is_active"?: boolean;
    };
    "UserSelectionListResponse": {
      "count": number;
      "next": string | null;
      "previous": string | null;
      "results": Array<components["schemas"]["UserSelection"]>;
    };
    "UserWrite": components["schemas"]["UserWriteRequest"];
    "UserWriteRequest": {
      "username": string;
      "first_name"?: string;
      "last_name"?: string;
      "email"?: string | string;
      "password"?: string;
      "is_active"?: boolean;
      "is_staff"?: boolean;
      "group_ids"?: Array<number>;
      "direct_application_ids"?: Array<number>;
    };
  };
}
