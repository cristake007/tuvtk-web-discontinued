import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import type { ShellConfiguration } from "@/api/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  getNavigationIcon,
  isNavigationPathActive,
  type NavigationNode,
} from "./navigation";

type AppSidebarProps = {
  configuration: ShellConfiguration;
  navigation: NavigationNode[];
};

const sidebarTooltip = {
  className: "bg-primary text-primary-foreground",
  arrowClassName: "bg-primary fill-primary",
  side: "right" as const,
  sideOffset: 8,
};

const navigationLinkClassName = [
  "relative h-10 cursor-pointer rounded-none px-4 text-primary",
  "transition-[padding,color,background-color] duration-200 ease-out",
  "before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
  "before:origin-center before:scale-y-0 before:bg-brand-red",
  "before:transition-transform before:duration-200 before:ease-out",
  "hover:bg-primary/5 hover:pl-5 hover:text-brand-red hover:before:scale-y-100",
  "data-active:bg-primary/5 data-active:pl-5 data-active:font-semibold",
  "data-active:text-brand-red data-active:before:scale-y-100",
  "group-data-[collapsible=icon]:mx-auto! group-data-[collapsible=icon]:before:hidden",
  "[&_svg]:text-current",
].join(" ");

const navigationSubLinkClassName = [
  navigationLinkClassName,
  "pl-8 hover:pl-9 data-active:pl-9",
].join(" ");

function isNodeActive(node: NavigationNode, pathname: string): boolean {
  return (
    isNavigationPathActive(pathname, node.path) ||
    node.children.some((child) => isNodeActive(child, pathname))
  );
}

function SidebarBrand({ configuration }: { configuration: ShellConfiguration }) {
  const { setOpenMobile } = useSidebar();
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [configuration.logo_url]);

  const showConfiguredLogo = Boolean(configuration.logo_url) && !logoFailed;

  return (
    <NavLink
      aria-label={`${configuration.site_name} dashboard`}
      className="flex h-full w-full cursor-pointer items-center justify-center overflow-hidden outline-none [container-type:inline-size] focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      onClick={() => setOpenMobile(false)}
      to="/"
    >
      {showConfiguredLogo ? (
        <img
          alt={`${configuration.organization_name} logo`}
          className="h-16 w-[clamp(1.9rem,65cqw,11rem)] max-w-none origin-center scale-[1.48] transform-gpu object-contain"
          onError={() => setLogoFailed(true)}
          src={configuration.logo_url ?? undefined}
        />
      ) : (
        <span className="text-[clamp(0.625rem,8cqw,1rem)] font-bold tracking-wide text-primary">
          TUVTK
        </span>
      )}
    </NavLink>
  );
}

function NavigationEntry({ item }: { item: NavigationNode }) {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const Icon = getNavigationIcon(item.icon);
  const active = isNodeActive(item, location.pathname);

  return (
    <SidebarMenuItem className="w-full">
      <SidebarMenuButton
        className={navigationLinkClassName}
        isActive={active}
        render={
          <NavLink
            end={item.path === "/"}
            onClick={() => setOpenMobile(false)}
            to={item.path}
          />
        }
        tooltip={{
          children: item.label,
          ...sidebarTooltip,
        }}
      >
        <Icon aria-hidden="true" />
        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
      </SidebarMenuButton>

      {item.children.length > 0 ? (
        <SidebarMenuSub className="m-0 gap-0 border-0 p-0">
          {item.children.map((child) => (
            <SidebarMenuSubItem key={child.key}>
              <SidebarMenuSubButton
                className={navigationSubLinkClassName}
                isActive={isNavigationPathActive(location.pathname, child.path)}
                render={
                  <NavLink
                    onClick={() => setOpenMobile(false)}
                    to={child.path}
                  />
                }
              >
                <span>{child.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}

export function AppSidebar({ configuration, navigation }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-16 border-b border-sidebar-border p-0">
        <SidebarBrand configuration={configuration} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-4 text-primary/65 group-data-[collapsible=icon]:hidden">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu aria-label="Primary navigation" className="gap-0">
              {navigation.map((item) => (
                <NavigationEntry item={item} key={item.key} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex min-h-9 items-center gap-2 px-2 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-success" />
          <span className="truncate group-data-[collapsible=icon]:hidden">Connected</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
