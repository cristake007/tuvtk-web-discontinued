export type ShellConfiguration = {
  site_name: string;
  organization_name: string;
  sidebar_title: string;
  logo_url: string | null;
};

export type ShellUser = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  is_staff: boolean;
};

export type AuthenticationSession = {
  authenticated: boolean;
  user: ShellUser | null;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type NavigationItem = {
  key: string;
  label: string;
  path: string;
  icon: string;
  position: number;
  parent_key: string | null;
  application_key: string;
};

export type CoreBootstrap = {
  configuration: ShellConfiguration;
  user: ShellUser;
  navigation: NavigationItem[];
};

export type DatabaseHealth = {
  alias: string;
  status: "ok" | "error";
};

export type HealthResponse = {
  status: "ok" | "degraded";
  databases: Record<string, DatabaseHealth>;
};
