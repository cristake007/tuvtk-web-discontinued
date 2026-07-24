import { useQuery } from "@tanstack/react-query";
import { ServerCrash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchPublicBranding,
  publicBrandingQueryKey,
} from "@/features/branding/api";
import { PublicBrandMark } from "@/features/branding/PublicBrandMark";
import type { PublicBranding } from "@/features/branding/types";

const fallbackBranding: PublicBranding = {
  site_name: "TUVTK",
  organization_name: "TÜV Thüringen Karpat",
  logo_url: null,
};

type ApplicationStateProps = {
  title: string;
  description: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function ApplicationState({
  title,
  description,
  loading = false,
  actionLabel,
  onAction,
}: ApplicationStateProps) {
  const brandingQuery = useQuery({
    queryKey: publicBrandingQueryKey,
    queryFn: fetchPublicBranding,
    enabled: loading,
    retry: 1,
    staleTime: 5 * 60_000,
  });

  if (loading) {
    const branding = brandingQuery.data ?? fallbackBranding;

    return (
      <main
        aria-live="polite"
        className="flex min-h-svh items-center justify-center bg-white px-6 py-12"
        role="status"
      >
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <PublicBrandMark
            branding={branding}
            className="animate-pulse motion-reduce:animate-none"
          />
          <p className="mt-6 text-lg font-semibold tracking-tight text-foreground">
            {title}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-svh place-items-center bg-white p-6">
      <Card className="w-full max-w-md" role="alert">
        <CardHeader className="items-center text-center">
          <span className="mb-2 grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
            <ServerCrash className="size-5" />
          </span>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {actionLabel && onAction ? (
          <CardContent className="flex justify-center">
            <Button onClick={onAction} type="button" variant="outline">
              {actionLabel}
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </main>
  );
}
