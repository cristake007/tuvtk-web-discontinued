import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { ApiError } from "@/api/http";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { login } from "@/features/auth/api";
import { authQueryKeys } from "@/features/auth/queryKeys";

const workspaceFeatures: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: LayoutDashboard,
    title: "One internal workspace",
    description: "Company records, documents, settings, and future modules in one interface.",
  },
  {
    icon: Database,
    title: "Connected business data",
    description: "Operational and registry data remain separated and managed by Django.",
  },
  {
    icon: ShieldCheck,
    title: "Protected access",
    description: "Django sessions, permissions, password hashing, and CSRF protection.",
  },
];

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid size-11 shrink-0 place-items-center rounded-md bg-primary text-base font-bold text-primary-foreground shadow-sm">
        T
        <span className="absolute inset-x-0 bottom-0 h-1 rounded-b-md bg-brand-red" />
      </span>
      <span className="leading-tight">
        <span className="block font-semibold">TÜV Thüringen Karpat</span>
        <span
          className={
            compact
              ? "block text-sm text-muted-foreground"
              : "block text-sm text-primary-foreground/70"
          }
        >
          Internal operations platform
        </span>
      </span>
    </div>
  );
}

function WorkspaceFeature({
  icon: Icon,
  title,
  description,
}: (typeof workspaceFeatures)[number]) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-primary-foreground/10 ring-1 ring-primary-foreground/15">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-primary-foreground/70">
          {description}
        </span>
      </span>
    </li>
  );
}

export function LoginPage() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKeys.session, session);
      void queryClient.invalidateQueries({ queryKey: ["core-bootstrap"] });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({ username, password });
  };

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.isError
        ? "Login failed. Please try again."
        : null;

  return (
    <main className="min-h-svh bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-16">
        <span className="absolute inset-x-0 top-0 h-1 bg-brand-red" />
        <BrandLockup />

        <div className="max-w-xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">
            Secure workspace
          </p>
          <h1 className="max-w-lg text-4xl font-semibold tracking-tight xl:text-5xl">
            The operational platform for TÜV Thüringen Karpat.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-primary-foreground/75">
            A focused interface for internal work, backed by Django permissions and reliable business data.
          </p>

          <ul className="mt-10 grid gap-5">
            {workspaceFeatures.map((feature) => (
              <WorkspaceFeature key={feature.title} {...feature} />
            ))}
          </ul>
        </div>

        <p className="text-sm text-primary-foreground/55">
          Authorized users only
        </p>
      </section>

      <section className="flex min-h-svh items-center justify-center p-5 sm:p-8 lg:min-h-0 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-7 lg:hidden">
            <BrandLockup compact />
          </div>

          <Card className="gap-0 overflow-hidden py-0 shadow-xl shadow-foreground/5">
            <div className="h-1 bg-brand-red" />
            <CardHeader className="px-6 pt-7 pb-5 sm:px-8">
              <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
              <CardDescription className="max-w-sm leading-relaxed">
                Sign in with your Django account to continue to the internal workspace.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-7 sm:px-8">
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      aria-invalid={loginMutation.isError}
                      autoComplete="username"
                      autoFocus
                      disabled={loginMutation.isPending}
                      id="username"
                      name="username"
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Enter your username"
                      required
                      type="text"
                      value={username}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      aria-invalid={loginMutation.isError}
                      autoComplete="current-password"
                      disabled={loginMutation.isPending}
                      id="password"
                      name="password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      required
                      type="password"
                      value={password}
                    />
                  </Field>

                  {errorMessage ? (
                    <Alert variant="destructive">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  ) : null}

                  <Button
                    className="h-10 w-full cursor-pointer"
                    disabled={loginMutation.isPending}
                    type="submit"
                  >
                    {loginMutation.isPending ? (
                      <Spinner />
                    ) : (
                      <LockKeyhole aria-hidden="true" />
                    )}
                    {loginMutation.isPending ? "Signing in…" : "Sign in securely"}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Access is restricted to approved company accounts. Contact the platform administrator when access is unavailable.
          </p>
        </div>
      </section>
    </main>
  );
}
