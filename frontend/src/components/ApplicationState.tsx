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
  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-6">
      <Card
        aria-live={loading ? "polite" : undefined}
        className="w-full max-w-md"
        role={loading ? "status" : "alert"}
      >
        <CardHeader className="items-center text-center">
          <span className="mb-2 grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
            {loading ? <Spinner className="size-5" /> : <ServerCrash className="size-5" />}
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
