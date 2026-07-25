import type { ShellUser } from "../auth/types.js";

export type ShellConfiguration = {
  site_name: string;
  organization_name: string;
  sidebar_title: string;
  logo_url: string | null;
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
  authenticated: boolean;
  configuration: ShellConfiguration;
  user: ShellUser | null;
  navigation: NavigationItem[];
};

export type DatabaseHealth = {
  alias: string;
  status: "ok" | "error" | "disabled";
};

export type HealthResponse = {
  status: "ok" | "degraded";
  databases: Record<string, DatabaseHealth>;
};
