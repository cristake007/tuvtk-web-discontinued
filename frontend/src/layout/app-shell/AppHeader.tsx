import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import type { ShellConfiguration } from "@/api/types";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { ShellUser } from "@/features/auth/types";
import type { NavigationItem } from "@/features/core/types";
import { cn } from "@/lib/utils";

import { HeaderSearch } from "./HeaderSearch";
import { NotificationMenu } from "./NotificationMenu";
import { UserMenu } from "./UserMenu";

type AppHeaderProps = {
  compact: boolean;
  configuration: ShellConfiguration;
  navigation: NavigationItem[];
  user: ShellUser;
  logoutPending: boolean;
  onLogout: () => void;
};

function HeaderBrand({
  compact,
  configuration,
}: {
  compact: boolean;
  configuration: ShellConfiguration;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [configuration.logo_url]);

  const showConfiguredLogo = Boolean(configuration.logo_url) && !logoFailed;

  return (
    <NavLink
      aria-label={`${configuration.site_name} — Dashboard`}
      className="flex w-36 shrink-0 items-center justify-start outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44 md:w-56"
      to="/"
    >
      {showConfiguredLogo ? (
        <img
          alt={`Sigla ${configuration.organization_name}`}
          className={cn(
            "max-w-full object-contain object-left transition-[height] duration-200 ease-out motion-reduce:transition-none",
            compact ? "h-10" : "h-14",
          )}
          onError={() => setLogoFailed(true)}
          src={configuration.logo_url ?? undefined}
        />
      ) : (
        <span className="text-sm font-bold tracking-wide text-primary">
          {configuration.site_name}
        </span>
      )}
    </NavLink>
  );
}

export function AppHeader({
  compact,
  configuration,
  navigation,
  user,
  logoutPending,
  onLogout,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-[60] flex w-full shrink-0 items-center border-b border-border/70 bg-white/95 px-3 shadow-sm backdrop-blur transition-[height,box-shadow] duration-200 ease-out motion-reduce:transition-none sm:px-5",
        compact ? "h-16 shadow-md" : "h-20",
      )}
    >
      <div className="flex w-full items-center gap-3">
        <SidebarTrigger
          aria-label="Deschide sau închide navigația"
          className="shrink-0 rounded-sm text-primary hover:bg-primary/5 hover:text-brand-red aria-expanded:bg-primary/5 aria-expanded:text-brand-red md:hidden"
        />

        <HeaderBrand compact={compact} configuration={configuration} />

        <div className="hidden min-w-0 flex-1 justify-center px-3 md:flex lg:px-8">
          <HeaderSearch navigation={navigation} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
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
