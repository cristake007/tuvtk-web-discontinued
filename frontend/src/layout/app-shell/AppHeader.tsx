import { ChevronDown, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

import type { ShellUser } from "@/api/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";

type AppHeaderProps = {
  organizationName: string;
  pageTitle: string;
  user: ShellUser;
  logoutPending: boolean;
  onLogout: () => void;
};

function getInitials(displayName: string): string {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
}

export function AppHeader({
  organizationName,
  pageTitle,
  user,
  logoutPending,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-6">
      <SidebarTrigger aria-label="Toggle navigation" className="-ml-1" />
      <Separator className="h-4" orientation="vertical" />

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="hidden min-w-0 sm:inline-flex">
            <BreadcrumbLink
              className="max-w-64 truncate"
              render={<Link to="/" />}
            >
              {organizationName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:list-item" />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-medium">
              {pageTitle}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Open user menu"
              className="h-9 max-w-64 justify-start gap-2 px-2"
              variant="ghost"
            />
          }
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.display_name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 text-left md:block">
            <span className="block truncate text-sm font-medium leading-tight">
              {user.display_name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {user.email || user.username}
            </span>
          </span>
          <ChevronDown aria-hidden="true" className="hidden text-muted-foreground md:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="py-2">
              <span className="block truncate text-sm font-medium text-foreground">
                {user.display_name}
              </span>
              <span className="mt-0.5 block truncate font-normal text-muted-foreground">
                {user.email || user.username}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={logoutPending} onClick={onLogout}>
            {logoutPending ? <Spinner /> : <LogOut aria-hidden="true" />}
            {logoutPending ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
