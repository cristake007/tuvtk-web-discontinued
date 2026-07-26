import type { components } from "../../api/generated.js";

export type ShellConfiguration = components["schemas"]["ShellConfiguration"];
export type NavigationItem = components["schemas"]["NavigationItem"];
export type CoreBootstrap = components["schemas"]["CoreBootstrap"] & {
  accessible_application_keys: string[];
};
export type DatabaseHealth = components["schemas"]["DatabaseHealth"];
export type HealthResponse = components["schemas"]["HealthResponse"];
