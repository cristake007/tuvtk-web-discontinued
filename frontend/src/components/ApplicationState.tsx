import { useEffect } from "react";
import { ServerCrash } from "lucide-react";

import { useLoadingOverlay } from "@/app/LoadingOverlayContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  const { beginLoading } = useLoadingOverlay();

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
