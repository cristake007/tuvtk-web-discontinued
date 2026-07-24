import {
  Building2,
  CalendarRange,
  Circle,
  FileText,
  Files,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export {
  buildNavigationTree,
  findCurrentNavigationItem,
  isNavigationPathActive,
} from "./navigation-model";
export type { NavigationNode } from "./navigation-model";

const navigationIcons: Record<string, LucideIcon> = {
  "building-2": Building2,
  "calendar-range": CalendarRange,
  "file-text": FileText,
  files: Files,
  "layout-dashboard": LayoutDashboard,
  settings: Settings,
};

export function getNavigationIcon(icon: string): LucideIcon {
  return navigationIcons[icon] ?? Circle;
}
