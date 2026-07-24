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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  getNavigationIcon,
  isNavigationPathActive,
  type NavigationNode,
} from "./navigation";

type AppSidebarProps = {
  configuration: ShellConfiguration;
  navigation: NavigationNode[];
};

const tooltipClassName =
  "bg-primary text-primary-foreground [&>svg]:bg-primary [&>svg]:fill-primary";

const navigationLinkClassName = [
  "relative h-10! cursor-pointer rounded-none! px-4! text-primary!",
  "transition-[padding,color,background-color] duration-200 ease-out",
  "before:absolute before:inset-y-2 before:left-0 before:w-0.5",
  "before:origin-center before:scale-y-0 before:bg-brand-red",
  "before:transition-transform before:duration-200 before:ease-out",
  "hover:bg-primary/5! hover:pl-5! hover:text-brand-red! hover:before:scale-y-100",
  "data-active:bg-primary/5! data-active:pl-5! data-active:font-semibold",
  "data-active:text-brand-red! data-active:before:scale-y-100",
  "[&_svg]:text-current",
].join(" ");

const navigationSubLinkClassName = [
  navigationLinkClassName,
  "pl-8! hover:pl-9! data-active:pl-9!",
].join(" ");

function isNodeActive(node: NavigationNode, pathname: string): boolean {
  return (
    isNavigationPathActive(pathname, node.path) ||
    node.children.some((child) => isNodeActive(child, pathname))
  );
}

function SidebarBrand({ configuration }: { configuration: ShellConfiguration }) {
  const { isMobile, setOpenMobile, state } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <NavLink
            aria-label={`${configuration.site_name} dashboard`}
            className="flex h-full cursor-pointer items-center gap-3 px-2 outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            onClick={() => setOpenMobile(false)}
            to="/"
          />
        }
      >
        <span className="grid size-8 shrink-0 place-items-center bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          T
        </span>
        <span className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
          <span className="block truncate text-sm font-semibold text-primary">
            {configuration.site_name}
          </span>
          <span className="block truncate text-xs text-primary/65">
            {configuration.sidebar_title}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClassName}
        hidden={state !== "collapsed" || isMobile}
        side="right"
        sideOffset={8}
      >
        {configuration.site_name}
      </TooltipContent>
    </Tooltip>
  );
}

function NavigationEntry({ item }: { item: NavigationNode }) {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const Icon = getNavigationIcon(item.icon);
  const active = isNodeActive(item, location.pathname);

  return (
    <SidebarMenuItem>
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
          className: tooltipClassName,
          sideOffset: 8,
        }}
      >
        <Icon aria-hidden="true" />
        <span>{item.label}</span>
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
      <SidebarHeader className="h-16 border-b border-sidebar-border p-2">
        <SidebarBrand configuration={configuration} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-4 text-primary/65">
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
