export function parseCompanyRouteId(value: string | undefined): number | null {
  if (value === undefined) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
