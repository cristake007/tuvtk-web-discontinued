import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import type { ShellConfiguration } from "@/api/types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  "relative mx-auto! h-10 cursor-pointer rounded-none px-4 text-primary",
  "transition-[width,height,padding,color,background-color] duration-200 ease-linear",
  "before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
  "before:origin-center before:scale-y-0 before:bg-brand-red",
  "before:transition-transform before:duration-200 before:ease-out",
  "hover:bg-primary/5 hover:pl-5 hover:text-brand-red hover:before:scale-y-100",
  "data-active:bg-primary/5 data-active:pl-5 data-active:font-semibold",
  "data-active:text-brand-red data-active:before:scale-y-100",
  "group-data-[collapsible=icon]:before:hidden",
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
  const { setOpenMobile, state } = useSidebar();
  const [logoFailed, setLogoFailed] = useState(false);
  const [logoExpanded, setLogoExpanded] = useState(state !== "collapsed");
  const previousState = useRef(state);

  useEffect(() => {
    setLogoFailed(false);
  }, [configuration.logo_url]);

  useLayoutEffect(() => {
    if (previousState.current === state) {
      return undefined;
    }

    previousState.current = state;

    if (state === "collapsed") {
      setLogoExpanded(false);
      return undefined;
    }

    setLogoExpanded(false);

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setLogoExpanded(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [state]);

  const showConfiguredLogo = Boolean(configuration.logo_url) && !logoFailed;

  return (
    <NavLink
      aria-label={`${configuration.site_name} dashboard`}
      className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden px-3 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      onClick={() => setOpenMobile(false)}
      to="/"
    >
      {showConfiguredLogo ? (
        <img
          alt={`${configuration.organization_name} logo`}
          className={[
            "absolute h-16 w-52 max-w-none object-contain transform-gpu",
            "transition-transform duration-200 ease-linear motion-reduce:transition-none",
            logoExpanded ? "scale-105" : "scale-[0.22]",
          ].join(" ")}
          onError={() => setLogoFailed(true)}
          src={configuration.logo_url ?? undefined}
        />
      ) : (
        <span className="text-[11px] font-bold tracking-normal text-primary">
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
        <span className="whitespace-nowrap">{item.label}</span>
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

function BrandSidebarRail() {
  const { state, toggleSidebar } = useSidebar();
  const RailIcon = state === "collapsed" ? ChevronRight : ChevronLeft;

  return (
    <button
      aria-label={state === "collapsed" ? "Expand navigation" : "Collapse navigation"}
      className="group/rail absolute top-16 bottom-0 z-40 hidden w-7 cursor-pointer items-center justify-center group-data-[side=left]:-right-3.5 group-data-[side=right]:-left-3.5 sm:flex"
      onClick={toggleSidebar}
      title={state === "collapsed" ? "Expand navigation" : "Collapse navigation"}
      type="button"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-sidebar-border/70 transition-[background-color,box-shadow] duration-200 group-hover/rail:bg-primary group-hover/rail:shadow-[0_0_3px_rgb(22_65_148_/_0.18)]"
      />
      <span className="relative z-10 grid size-7 aspect-square shrink-0 place-items-center overflow-hidden rounded-full border border-sidebar-border bg-white p-0 text-sidebar-foreground/70 shadow-sm transition-[border-color,color,transform,box-shadow] duration-200 group-hover/rail:scale-105 group-hover/rail:border-primary group-hover/rail:text-primary group-hover/rail:shadow-primary/15">
        <RailIcon aria-hidden="true" className="size-3.5" />
      </span>
    </button>
  );
}

export function AppSidebar({ configuration, navigation }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-24 shrink-0 p-0">
        <SidebarBrand configuration={configuration} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-0 pt-1">
          <SidebarGroupContent>
            <SidebarMenu aria-label="Primary navigation" className="gap-0">
              {navigation.map((item) => (
                <NavigationEntry item={item} key={item.key} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <BrandSidebarRail />
    </Sidebar>
  );
}
