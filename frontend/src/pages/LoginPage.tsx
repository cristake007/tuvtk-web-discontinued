import type { CSSProperties } from "react";

import { LoginForm } from "@/features/auth/LoginForm";
import { PublicBrandMark } from "@/features/branding/PublicBrandMark";
import type { PublicBranding } from "@/features/branding/types";

type LoginThemeStyle = CSSProperties & {
  "--background": string;
  "--heading": string;
  "--primary": string;
};

export function LoginPage({ branding }: { branding: PublicBranding }) {
  const themeStyle: LoginThemeStyle = {
    "--background": branding.culoare_fundal,
    "--heading": branding.culoare_titluri,
    "--primary": branding.culoare_primara,
  };

  return (
    <main className="min-h-[100dvh] bg-background" style={themeStyle}>
      <div className="grid min-h-[100dvh] lg:grid-cols-[22.5rem_minmax(0,1fr)]">
        <section className="flex items-center bg-card px-6 py-12 lg:min-h-[100dvh]">
          <div className="mx-auto w-full max-w-[17rem]">
            <PublicBrandMark branding={branding} className="justify-center" />
            <div className="mt-10">
              <LoginForm />
            </div>
          </div>
        </section>

        <section className="relative min-h-[18rem] overflow-hidden border-t border-border lg:min-h-[100dvh] lg:border-t-0 lg:border-l">
          <img
            alt="Profesional lucrând la un birou modern"
            className="absolute inset-0 size-full object-cover"
            src="/images/login-workspace.png"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-primary/10"
          />
        </section>
      </div>
    </main>
  );
}
