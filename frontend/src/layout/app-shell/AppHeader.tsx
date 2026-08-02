import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import type { ShellConfiguration } from "@/api/types";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import type { ShellUser } from "@/features/auth/types";
import type { NavigationItem } from "@/features/core/types";
import { cn } from "@/lib/utils";

import { HeaderSearch } from "./HeaderSearch";
import { NotificationMenu } from "./NotificationMenu";
import { UserMenu } from "./UserMenu";

type AppHeaderProps = {
  configuration: ShellConfiguration;
  navigation: NavigationItem[];
  user: ShellUser;
  logoutPending: boolean;
  onLogout: () => void;
};

function HeaderBrand({
  configuration,
  className,
  logoClassName,
}: {
  configuration: ShellConfiguration;
  className: string;
  logoClassName: string;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [configuration.logo_url]);

  const showConfiguredLogo = Boolean(configuration.logo_url) && !logoFailed;

  return (
    <NavLink
      aria-label={`${configuration.site_name} — Dashboard`}
      className={cn(
        "flex shrink-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      to="/"
    >
      {showConfiguredLogo ? (
        <img
          alt={`Sigla ${configuration.organization_name}`}
          className={cn("max-w-full object-contain", logoClassName)}
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
  configuration,
  navigation,
  user,
  logoutPending,
  onLogout,
}: AppHeaderProps) {
  const { isMobile, state } = useSidebar();
  const sidebarEsteRestrans = !isMobile && state === "collapsed";
  const latimeLogoDesktop = sidebarEsteRestrans
    ? "w-(--sidebar-width-icon)"
    : "w-(--sidebar-width)";
  const spatiuContinutDesktop = sidebarEsteRestrans
    ? "md:pl-(--sidebar-width-icon)"
    : "md:pl-(--sidebar-width)";
  const dimensiuneLogoDesktop = sidebarEsteRestrans
    ? "h-8 max-w-8 object-center"
    : "h-14 max-w-[15rem] object-center";

  return (
    <header className="sticky top-0 z-[60] h-16 w-full shrink-0 border-b border-border/70 bg-white/95 px-3 shadow-sm backdrop-blur sm:px-5">
      <HeaderBrand
        className={cn(
          "absolute inset-y-0 left-0 z-10 hidden justify-center md:flex",
          latimeLogoDesktop,
        )}
        configuration={configuration}
        logoClassName={dimensiuneLogoDesktop}
      />

      <div className={cn("flex h-full w-full items-center gap-3", spatiuContinutDesktop)}>
        <SidebarTrigger
          aria-label="Deschide sau închide navigația"
          className="shrink-0 rounded-sm text-primary hover:bg-primary/5 hover:text-brand-red aria-expanded:bg-primary/5 aria-expanded:text-brand-red md:hidden"
        />

        <HeaderBrand
          className="w-36 justify-start sm:w-44 md:hidden"
          configuration={configuration}
          logoClassName="h-11 object-left sm:h-12"
        />

        <div className="hidden min-w-0 flex-1 justify-center px-3 md:flex lg:px-8">
          <HeaderSearch navigation={navigation} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <NotificationMenu />
          <UserMenu logoutPending={logoutPending} onLogout={onLogout} user={user} />
        </div>
      </div>
    </header>
  );
}
