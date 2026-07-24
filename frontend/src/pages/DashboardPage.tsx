import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Database, Search, ShieldCheck, type LucideIcon } from "lucide-react";

import { fetchHealth } from "@/api/core";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type HealthCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  loading: boolean;
  status?: string;
};

function HealthCard({
  description,
  icon: Icon,
  label,
  loading,
  status,
}: HealthCardProps) {
  const healthy = status === "ok";

  return (
    <Card>
      <CardHeader className="grid grid-cols-[auto_1fr] items-center gap-x-3">
        <span className="row-span-2 grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <CardDescription>{label}</CardDescription>
        {loading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <CardTitle
            className={cn(
              "capitalize",
              healthy ? "text-success" : status ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {status ?? "Unavailable"}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const healthQuery = useQuery({
    queryKey: ["system-health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  const databases = healthQuery.data?.databases ?? {};

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Overview
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Application foundation
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          React owns the user interface while Django provides identity, permissions,
          configuration, and business data through the API.
        </p>
      </div>

      {healthQuery.isError ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Health status is unavailable</AlertTitle>
          <AlertDescription>
            The dashboard could not refresh the current service status.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <HealthCard
          description="Users, settings, navigation, and operational records."
          icon={Database}
          label="Core database"
          loading={healthQuery.isPending}
          status={databases.core?.status}
        />
        <HealthCard
          description="ONRC companies and searchable registry information."
          icon={Search}
          label="Registry database"
          loading={healthQuery.isPending}
          status={databases.registry?.status}
        />
        <HealthCard
          description="Django Ninja versioned API available under /api/v1/."
          icon={ShieldCheck}
          label="API status"
          loading={healthQuery.isPending}
          status={healthQuery.data?.status}
        />
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Next module</CardDescription>
          <CardTitle>Company Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            The shell is ready for the company directory, document editor, and other
            modules. Each module will own its React routes and Django Ninja router.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
