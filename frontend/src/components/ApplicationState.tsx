import { useEffect, useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import {
  fetchPublicBranding,
  publicBrandingQueryKey,
} from "@/features/branding/api";

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
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = brandingQuery.data?.logo_url ?? null;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  if (loading) {
    const showLogo = Boolean(logoUrl) && !logoFailed;

    return (
      <main
        aria-live="polite"
        className="flex min-h-svh items-center justify-center bg-background px-6 py-12"
        role="status"
      >
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          {showLogo ? (
            <img
              alt={`${brandingQuery.data?.organization_name ?? "Company"} logo`}
              className="max-h-36 max-w-[26rem] animate-pulse object-contain object-center motion-reduce:animate-none"
              onError={() => setLogoFailed(true)}
              src={logoUrl ?? undefined}
            />
          ) : (
            <Spinner className="size-8 text-primary" />
          )}

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
    <main className="grid min-h-svh place-items-center bg-background p-6">
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
