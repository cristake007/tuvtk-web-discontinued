import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Open notifications"
            className="relative cursor-pointer rounded-sm text-primary hover:bg-primary/5 hover:text-brand-red"
            size="icon-lg"
            title="Notifications"
            variant="ghost"
          />
        }
      >
        <Bell aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-1" sideOffset={8}>
        <DropdownMenuLabel className="px-3 py-2.5">
          <span className="block text-sm font-semibold text-foreground">
            Notifications
          </span>
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            Updates that require your attention will appear here.
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex min-h-28 flex-col items-center justify-center px-5 py-6 text-center">
          <span className="grid size-9 place-items-center rounded-sm bg-primary/5 text-primary">
            <Bell aria-hidden="true" className="size-4" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">
            No new notifications
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            You are up to date.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
