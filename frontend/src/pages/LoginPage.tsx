import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";

import { ApiError, login } from "../api/client";


export function LoginPage() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth-session"], user);
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
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand" aria-hidden="true">
          T
        </div>

        <div className="login-heading">
          <span>TÜV Thüringen Karpat</span>
          <h1 id="login-title">Sign in to TUVTK</h1>
          <p>Use your Django account to access the internal platform.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              autoComplete="username"
              autoFocus
              disabled={loginMutation.isPending}
              onChange={(event) => setUsername(event.target.value)}
              required
              type="text"
              value={username}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              disabled={loginMutation.isPending}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {errorMessage ? (
            <div className="login-error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          <button className="login-submit" disabled={loginMutation.isPending} type="submit">
            <LockKeyhole aria-hidden="true" size={18} />
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
