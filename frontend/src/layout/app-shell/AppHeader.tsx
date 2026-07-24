import { ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import type { ShellUser } from "@/api/types";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  const roleLabel = user.is_staff ? "Administrator" : "Team member";
  const RoleIcon = user.is_staff ? ShieldCheck : UserRound;
  const identity = user.email || user.username;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-6">
      <SidebarTrigger aria-label="Toggle navigation" className="-ml-1 cursor-pointer" />
      <Separator className="h-4" orientation="vertical" />

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="hidden min-w-0 sm:inline-flex">
            <BreadcrumbLink
              className="max-w-64 cursor-pointer truncate"
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
              aria-label={`Open ${user.display_name} account menu`}
              className="h-10 max-w-72 cursor-pointer justify-start gap-2 rounded-lg border border-transparent px-2 hover:border-border hover:bg-muted/70 aria-expanded:border-border aria-expanded:bg-muted/70"
              variant="ghost"
            />
          }
        >
          <Avatar className="shadow-sm ring-1 ring-border" size="default">
            <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
              {getInitials(user.display_name)}
            </AvatarFallback>
            <AvatarBadge
              aria-label="Online"
              className="bg-success ring-background"
              title="Online"
            />
          </Avatar>
          <span className="hidden min-w-0 text-left md:block">
            <span className="block truncate text-sm font-medium leading-tight">
              {user.display_name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {identity}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="hidden text-muted-foreground md:block"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-1.5" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-2.5">
              <span className="flex items-center gap-3">
                <Avatar className="shadow-sm ring-1 ring-border" size="lg">
                  <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                    {getInitials(user.display_name)}
                  </AvatarFallback>
                  <AvatarBadge
                    aria-label="Online"
                    className="bg-success ring-popover"
                    title="Online"
                  />
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {user.display_name}
                  </span>
                  <span className="mt-0.5 block truncate font-normal text-muted-foreground">
                    {identity}
                  </span>
                  <Badge className="mt-1.5" variant="secondary">
                    <RoleIcon aria-hidden="true" />
                    {roleLabel}
                  </Badge>
                </span>
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer py-2"
            disabled={logoutPending}
            onClick={onLogout}
            variant="destructive"
          >
            {logoutPending ? <Spinner /> : <LogOut aria-hidden="true" />}
            {logoutPending ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
