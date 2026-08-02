export const monthNames = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
] as const;

export const abbreviatedMonthNames = monthNames.map((monthName) => monthName.slice(0, 3));

export function formatSelectedMonths(months: number[]): string {
  if (months.length === 0) {
    return "Nicio lună selectată";
  }

  if (months.length === monthNames.length) {
    return "Toate lunile";
  }

  return months
    .map((month) => monthNames[month - 1])
    .filter(Boolean)
    .join(", ");
}
