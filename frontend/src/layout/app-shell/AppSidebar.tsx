import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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

  useEffect(() => {
    if (copilActiv) {
      setDeschis(true);
    }
  }, [copilActiv]);

  if (item.children.length > 0) {
    if (!isMobile && state === "collapsed") {
      return (
        <MeniuFlyoutNavigatie
          activ={activ}
          caleCurenta={location.pathname}
          clasaDeclansator={navigationLinkClassName}
          item={item}
        />
      );
    }

    return (
      <SidebarMenuItem className="w-full">
        <Collapsible onOpenChange={setDeschis} open={deschis}>
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                className={navigationLinkClassName}
                isActive={activ}
                tooltip={{
                  children: item.label,
                  ...sidebarTooltip,
                }}
              />
            }
          >
            <Icon aria-hidden="true" />
            <span className="whitespace-nowrap">{item.label}</span>
            <ChevronRight
              aria-hidden="true"
              className={`ml-auto size-4 shrink-0 transition-transform ${deschis ? "rotate-90" : ""}`}
            />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub className="m-0 gap-0 border-0 p-0">
              {item.children.map((copil) => (
                <SidebarMenuSubItem key={copil.key}>
                  <SidebarMenuSubButton
                    className={navigationSubLinkClassName}
                    isActive={isNavigationPathActive(location.pathname, copil.path)}
                    render={<NavLink onClick={() => setOpenMobile(false)} to={copil.path} />}
                  >
                    <span>{copil.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
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

      <BrandSidebarRail />
    </Sidebar>
  );
}
