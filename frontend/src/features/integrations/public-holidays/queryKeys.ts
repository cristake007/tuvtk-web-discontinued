export const publicHolidayQueryKeys = {
  all: ["public-holidays"] as const,
  settings: () => [...publicHolidayQueryKeys.all, "settings"] as const,
  holidays: (year: number) =>
    [...publicHolidayQueryKeys.all, "holidays", year] as const,
};
