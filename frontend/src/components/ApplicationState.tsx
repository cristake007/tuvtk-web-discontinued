import { useEffect, useId } from "react";
import { ServerCrash } from "lucide-react";

import { useLoadingOverlay } from "@/app/LoadingOverlayContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

type ApplicationStateProps = {
  title: string;
  description: string;
  loading?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ApplicationState({
  title,
  description,
  loading = false,
  onRetry,
  retryLabel = "Încearcă din nou",
}: ApplicationStateProps) {
  const { beginLoading } = useLoadingOverlay();
  const titleId = useId();

  useEffect(() => {
    if (!loading) {
      return;
    }

    return beginLoading();
  }, [beginLoading, loading]);

  if (loading) {
    return null;
  }

  return (
    <section
      aria-labelledby={titleId}
      className="grid min-h-svh place-items-center bg-background p-6"
    >
      <Card className="w-full max-w-md" role="alert">
        <CardHeader className="items-center text-center">
          <span className="mb-2 grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
            <ServerCrash className="size-5" />
          </span>
          <h1 className="text-base font-semibold leading-snug text-heading" id={titleId}>
            {title}
          </h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {onRetry ? (
          <CardContent className="flex justify-center">
            <Button onClick={onRetry} type="button" variant="outline">
              {retryLabel}
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </section>
  );
}
