import {
  Building2,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarRange,
  Circle,
  Factory,
  FileText,
  Files,
  GraduationCap,
  LayoutDashboard,
  Plug,
  Settings,
  type LucideIcon,
} from "lucide-react";

const navigationIcons: Record<string, LucideIcon> = {
  "briefcase-business": BriefcaseBusiness,
  "badge-check": BadgeCheck,
  "building-2": Building2,
  "calendar-range": CalendarRange,
  "file-text": FileText,
  files: Files,
  factory: Factory,
  "graduation-cap": GraduationCap,
  "layout-dashboard": LayoutDashboard,
  plug: Plug,
  settings: Settings,
};

export function getNavigationIcon(icon: string): LucideIcon {
  return navigationIcons[icon] ?? Circle;
}
