import { NavLink } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  getNavigationIcon,
  isNavigationPathActive,
  type NavigationNode,
} from "./navigation";

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
  item: NavigationNode;
};

export function MeniuFlyoutNavigatie({
  activ,
  caleCurenta,
  clasaDeclansator,
  item,
}: MeniuFlyoutNavigatieProps) {
  const Icon = getNavigationIcon(item.icon);

  return (
    <SidebarMenuItem className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              aria-label={`Deschide meniul ${item.label}`}
              className={clasaDeclansator}
              isActive={activ}
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
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-max min-w-40"
          side="right"
          sideOffset={8}
        >
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
    </SidebarMenuItem>
  );
}
