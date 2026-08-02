import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink, useLocation } from "react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { getNavigationIcon, isNavigationPathActive, type NavigationNode } from "./navigation";
import { MeniuFlyoutNavigatie } from "./NavigationFlyoutMenu";

type AppSidebarProps = {
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
  "hover:bg-transparent! hover:pl-5 hover:text-brand-red hover:before:scale-y-100",
  "active:bg-transparent! active:text-brand-red!",
  "data-active:bg-transparent! data-active:pl-5 data-active:font-semibold",
  "data-active:text-brand-red data-active:before:scale-y-100",
  "group-data-[collapsible=icon]:before:hidden",
  "[&_svg]:size-5 [&_svg]:text-current",
].join(" ");

const navigationSubLinkClassName = [
  navigationLinkClassName,
  "pl-8 hover:pl-9 data-active:pl-9",
].join(" ");

function NavigationEntry({ item }: { item: NavigationNode }) {
  const location = useLocation();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const Icon = getNavigationIcon(item.icon);
  const copilActiv = item.children.some((copil) =>
    isNavigationPathActive(location.pathname, copil.path),
  );
  const [deschis, setDeschis] = useState(copilActiv);
  const activ =
    item.children.length === 0
      ? isNavigationPathActive(location.pathname, item.path)
      : location.pathname === item.path;

  useEffect(() => {
    if (copilActiv) {
      setDeschis(true);
    }
  }, [copilActiv]);

  if (item.is_separator) {
    return (
      <SidebarMenuItem className="px-4 py-2.5 group-data-[collapsible=icon]:px-2">
        <div aria-label={item.label} className="flex w-full items-center gap-2" role="separator">
          <span aria-hidden="true" className="h-px min-w-3 flex-1 bg-sidebar-border" />
          <span className="max-w-28 truncate text-[calc(10px*var(--app-font-scale))] font-semibold uppercase tracking-[0.14em] text-muted-foreground group-data-[collapsible=icon]:hidden">
            {item.label}
          </span>
          <span
            aria-hidden="true"
            className="h-px min-w-3 flex-1 bg-sidebar-border group-data-[collapsible=icon]:hidden"
          />
        </div>
      </SidebarMenuItem>
    );
  }

  if (item.children.length > 0) {
    return (
      <MeniuFlyoutNavigatie
        activ={activ}
        caleCurenta={location.pathname}
        clasaDeclansator={navigationLinkClassName}
        clasaSubmeniu={navigationSubLinkClassName}
        deschis={deschis}
        esteRestrans={!isMobile && state === "collapsed"}
        item={item}
        onDeschisChange={setDeschis}
        onNavigare={() => setOpenMobile(false)}
      />
    );
  }

  return (
    <SidebarMenuItem className="w-full">
      <SidebarMenuButton
        className={navigationLinkClassName}
        isActive={activ}
        render={
          <NavLink end={item.path === "/"} onClick={() => setOpenMobile(false)} to={item.path} />
        }
        tooltip={{
          children: item.label,
          ...sidebarTooltip,
        }}
      >
        <Icon aria-hidden="true" />
        <span className="whitespace-nowrap">{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function BrandSidebarRail() {
  const { state, toggleSidebar } = useSidebar();
  const RailIcon = state === "collapsed" ? ChevronRight : ChevronLeft;
  const expanded = state === "expanded";

  return (
    <button
      aria-label={expanded ? "Restrânge navigația" : "Extinde navigația"}
      className="group/rail absolute inset-y-0 z-40 hidden w-7 cursor-pointer items-center justify-center group-data-[side=left]:-right-3.5 group-data-[side=right]:-left-3.5 md:flex"
      onClick={toggleSidebar}
      title={expanded ? "Restrânge navigația" : "Extinde navigația"}
      type="button"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-sidebar-border/70 transition-[background-color,box-shadow] duration-200 group-hover/rail:bg-primary group-hover/rail:shadow-[0_0_3px_rgb(22_65_148_/_0.18)]"
      />
      <span className="relative z-10 grid size-6 shrink-0 place-items-center overflow-hidden rounded-full border border-sidebar-border bg-white p-0 text-sidebar-foreground/70 shadow-sm transition-[border-color,color,transform,box-shadow] duration-200 group-hover/rail:scale-105 group-hover/rail:border-primary group-hover/rail:text-primary group-hover/rail:shadow-primary/15">
        <RailIcon aria-hidden="true" className="size-3" />
      </span>
    </button>
  );
}

function SidebarCollapseControl() {
  const { state, toggleSidebar } = useSidebar();
  const esteRestrans = state === "collapsed";
  const ControlIcon = esteRestrans ? PanelLeftOpen : PanelLeftClose;
  const label = esteRestrans ? "Restaurează" : "Restrânge";

  return (
    <SidebarFooter className="hidden border-t border-sidebar-border bg-white p-0 md:flex">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            aria-label={label}
            className={navigationLinkClassName}
            onClick={toggleSidebar}
            tooltip={{
              children: label,
              ...sidebarTooltip,
            }}
          >
            <ControlIcon aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

export function AppSidebar({ navigation }: AppSidebarProps) {
  return (
    <Sidebar
      className="top-[var(--app-header-height)]! bottom-0! h-auto! bg-white transition-[top,left,right,width] duration-200 ease-out motion-reduce:transition-none"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarContent className="bg-white pt-[calc(var(--app-header-height)+0.5rem)] md:pt-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu
              aria-label="Navigație principală"
              className="gap-0 group-data-[collapsible=icon]:gap-2"
            >
              {navigation.map((item) => (
                <NavigationEntry item={item} key={item.key} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarCollapseControl />
      <BrandSidebarRail />
    </Sidebar>
  );
}
