import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { ShellUser } from "@/features/auth/types";

import { UserMenu } from "./UserMenu";

type AppHeaderProps = {
  pageTitle: string;
  user: ShellUser;
  logoutPending: boolean;
  onLogout: () => void;
};

export function AppHeader({
  pageTitle,
  user,
  logoutPending,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-6">
      <SidebarTrigger
        aria-label="Toggle navigation"
        className="-ml-1 cursor-pointer text-primary hover:bg-primary/5 hover:text-brand-red aria-expanded:bg-primary/5 aria-expanded:text-brand-red"
      />
      <Separator className="h-4" orientation="vertical" />
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
        {pageTitle}
      </h1>
      <UserMenu
        logoutPending={logoutPending}
        onLogout={onLogout}
        user={user}
      />
    </header>
  );
}
