export type ShellConfiguration = {
  site_name: string;
  organization_name: string;
  sidebar_title: string;
};

export type ShellUser = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  is_staff: boolean;
};

export type NavigationItem = {
  key: string;
  label: string;
  path: string;
  icon: string;
  position: number;
  parent_key: string | null;
};

export type CoreBootstrap = {
  configuration: ShellConfiguration;
  user: ShellUser | null;
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
