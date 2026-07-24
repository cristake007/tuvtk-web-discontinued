import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import type { ShellUser } from "@/api/types";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/spinner";

type UserMenuProps = {
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

function UserAvatar({ user, large = false }: { user: ShellUser; large?: boolean }) {
  return (
    <Avatar className="shadow-sm ring-1 ring-border" size={large ? "lg" : "default"}>
      <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
        {getInitials(user.display_name)}
      </AvatarFallback>
      <AvatarBadge
        aria-label="Online"
        className={large ? "bg-success ring-popover" : "bg-success ring-background"}
        title="Online"
      />
    </Avatar>
  );
}

export function UserMenu({ user, logoutPending, onLogout }: UserMenuProps) {
  const roleLabel = user.is_staff ? "Administrator" : "Team member";
  const RoleIcon = user.is_staff ? ShieldCheck : UserRound;
  const identity = user.email || user.username;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={`Open ${user.display_name} account menu`}
            className="cursor-pointer rounded-full p-0"
            size="icon-lg"
            title="Account"
            variant="ghost"
          />
        }
      >
        <UserAvatar user={user} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60 p-1" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2">
            <span className="flex items-center gap-2.5">
              <UserAvatar user={user} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {user.display_name}
                </span>
                <span className="mt-0.5 block truncate font-normal text-muted-foreground">
                  {identity}
                </span>
                <Badge className="mt-1.5 max-w-full" variant="secondary">
                  <RoleIcon aria-hidden="true" />
                  {roleLabel}
                </Badge>
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer py-1.5"
          disabled={logoutPending}
          onClick={onLogout}
          variant="destructive"
        >
          {logoutPending ? <Spinner /> : <LogOut aria-hidden="true" />}
          {logoutPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
