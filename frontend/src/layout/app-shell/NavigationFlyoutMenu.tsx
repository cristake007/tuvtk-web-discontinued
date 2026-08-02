import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { NavLink } from "react-router";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import { getNavigationIcon, isNavigationPathActive, type NavigationNode } from "./navigation";

const flyoutLinkClassName = [
  "relative min-h-8 cursor-pointer whitespace-nowrap rounded-none px-4 py-0.5 text-primary",
  "transition-[padding,color,background-color] duration-200 ease-linear",
  "before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
  "before:origin-center before:scale-y-0 before:bg-brand-red",
  "before:transition-transform before:duration-200 before:ease-out",
  "hover:bg-primary/5 hover:pl-5 hover:text-brand-red hover:before:scale-y-100",
  "focus:bg-primary/5 focus:pl-5 focus:text-brand-red focus:before:scale-y-100",
].join(" ");

type MeniuFlyoutNavigatieProps = {
  activ: boolean;
  caleCurenta: string;
  clasaDeclansator: string;
  clasaSubmeniu: string;
  deschis: boolean;
  esteRestrans: boolean;
  item: NavigationNode;
  onDeschisChange: (deschis: boolean) => void;
  onNavigare: () => void;
};

export function MeniuFlyoutNavigatie({
  activ,
  caleCurenta,
  clasaDeclansator,
  clasaSubmeniu,
  deschis,
  esteRestrans,
  item,
  onDeschisChange,
  onNavigare,
}: MeniuFlyoutNavigatieProps) {
  const Icon = getNavigationIcon(item.icon);
  const [flyoutDeschis, setFlyoutDeschis] = useState(false);

  return (
    <SidebarMenuItem className="w-full">
      <Collapsible onOpenChange={onDeschisChange} open={deschis}>
        <DropdownMenu
          onOpenChange={(open) => {
            if (esteRestrans) {
              setFlyoutDeschis(open);
            }
          }}
          open={esteRestrans && flyoutDeschis}
        >
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                aria-controls={esteRestrans ? undefined : `sidebar-submenu-${item.key}`}
                aria-expanded={esteRestrans ? flyoutDeschis : deschis}
                aria-haspopup={esteRestrans ? "menu" : undefined}
                aria-label={esteRestrans ? `Deschide meniul ${item.label}` : undefined}
                className={clasaDeclansator}
                isActive={activ}
                onClick={() => {
                  if (!esteRestrans) {
                    onDeschisChange(!deschis);
                  }
                }}
                tooltip={{
                  children: item.label,
                  className: "bg-primary text-primary-foreground",
                  arrowClassName: "bg-primary fill-primary",
                  side: "right",
                  sideOffset: 8,
                }}
              />
            }
          >
            <Icon aria-hidden="true" />
            <span className="whitespace-nowrap">{item.label}</span>
            <ChevronRight
              aria-hidden="true"
              className={`ml-auto size-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${
                deschis ? "rotate-90" : ""
              }`}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-max min-w-40" side="right" sideOffset={8}>
            {item.children.map((copil) => {
              const copilEsteActiv = isNavigationPathActive(caleCurenta, copil.path);

              return (
                <DropdownMenuItem
                  className={`${flyoutLinkClassName} ${
                    copilEsteActiv
                      ? "bg-primary/5 pl-5 font-semibold text-brand-red before:scale-y-100"
                      : ""
                  }`}
                  key={copil.key}
                  render={<NavLink to={copil.path} />}
                >
                  {copil.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <CollapsibleContent>
          <SidebarMenuSub className="m-0 gap-0 border-0 p-0" id={`sidebar-submenu-${item.key}`}>
            {item.children.map((copil) => (
              <SidebarMenuSubItem key={copil.key}>
                <SidebarMenuSubButton
                  className={clasaSubmeniu}
                  isActive={isNavigationPathActive(caleCurenta, copil.path)}
                  render={<NavLink onClick={onNavigare} to={copil.path} />}
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
