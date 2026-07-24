import { SidebarTrigger } from "@/components/ui/sidebar";
import type { ShellUser } from "@/features/auth/types";
import type { NavigationItem } from "@/features/core/types";

import { HeaderSearch } from "./HeaderSearch";
import { NotificationMenu } from "./NotificationMenu";
import { UserMenu } from "./UserMenu";

type AppHeaderProps = {
  navigation: NavigationItem[];
  user: ShellUser;
  logoutPending: boolean;
  onLogout: () => void;
};

export function AppHeader({
  navigation,
  user,
  logoutPending,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center border-b border-border/70 bg-background/90 px-4 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <div className="flex w-full items-center gap-3">
        <SidebarTrigger
          aria-label="Toggle navigation"
          className="-ml-1 shrink-0 cursor-pointer rounded-sm text-primary hover:bg-primary/5 hover:text-brand-red aria-expanded:bg-primary/5 aria-expanded:text-brand-red md:hidden"
        />

        <div className="flex min-w-0 flex-1 justify-center px-1 sm:px-4">
          <HeaderSearch navigation={navigation} />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <NotificationMenu />
          <UserMenu
            logoutPending={logoutPending}
            onLogout={onLogout}
            user={user}
          />
        </div>
      </div>
    </header>
  );
}
