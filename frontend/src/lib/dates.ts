const romanianDateTimeFormatter = new Intl.DateTimeFormat("ro-RO", {
  dateStyle: "medium",
  timeStyle: "short",
});

const romanianDateFormatter = new Intl.DateTimeFormat("ro-RO", {
  dateStyle: "medium",
});

export function formatRomanianDateTime(value: string | Date | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : romanianDateTimeFormatter.format(date);
}

export function formatRomanianDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : romanianDateFormatter.format(date);
}
