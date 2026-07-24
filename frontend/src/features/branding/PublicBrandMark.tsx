import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import type { PublicBranding } from "./types";

export function PublicBrandMark({
  branding,
  className,
  compact = false,
}: {
  branding: PublicBranding;
  className?: string;
  compact?: boolean;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [branding.logo_url]);

  const showLogo = Boolean(branding.logo_url) && !logoFailed;

  return (
    <div className={cn("flex items-center", className)}>
      {showLogo ? (
        <img
          alt={`${branding.organization_name} logo`}
          className={cn(
            "w-auto object-contain object-left",
            compact ? "max-h-14 max-w-64" : "max-h-28 max-w-[22rem]",
          )}
          onError={() => setLogoFailed(true)}
          src={branding.logo_url ?? undefined}
        />
      ) : (
        <span
          className={cn(
            "font-bold tracking-tight text-primary",
            compact ? "text-2xl" : "text-4xl",
          )}
        >
          {branding.site_name}
        </span>
      )}
    </div>
  );
}
