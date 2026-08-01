type AccessUser = {
  is_staff: boolean;
  is_superuser: boolean;
};

export function canAccessStaffRoute(user: AccessUser | null): boolean {
  return Boolean(user?.is_staff || user?.is_superuser);
}

export function canAccessApplicationRoute(
  accessibleApplicationKeys: readonly string[],
  applicationKey: string,
): boolean {
  return accessibleApplicationKeys.includes(applicationKey);
}
