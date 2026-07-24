import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, ShieldCheck } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { login } from "@/features/auth/api";
import { authQueryKeys } from "@/features/auth/queryKeys";

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
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            T
          </span>
          <div className="leading-tight">
            <p className="font-semibold">TÜV Thüringen Karpat</p>
            <p className="text-sm text-muted-foreground">Internal platform</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </div>
            <CardTitle className="text-lg">Sign in</CardTitle>
            <CardDescription>
              Use your Django account to access the internal workspace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  autoComplete="username"
                  autoFocus
                  disabled={loginMutation.isPending}
                  id="username"
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  type="text"
                  value={username}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete="current-password"
                  disabled={loginMutation.isPending}
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>

              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                className="mt-1 w-full"
                disabled={loginMutation.isPending}
                type="submit"
              >
                {loginMutation.isPending ? (
                  <Spinner />
                ) : (
                  <LockKeyhole aria-hidden="true" />
                )}
                {loginMutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
