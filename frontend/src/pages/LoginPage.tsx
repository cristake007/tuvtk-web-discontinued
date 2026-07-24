import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/features/auth/LoginForm";
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

const workPrinciples = [
  "Calitatea începe cu atenția acordată fiecărui detaliu.",
  "Încrederea se construiește prin consecvență, claritate și responsabilitate.",
  "Procesele bine gândite transformă munca de zi cu zi în rezultate predictibile.",
  "Îmbunătățirea continuă înseamnă pași mici, făcuți corect și constant.",
];

function RotatingQuote() {
  const [quoteIndex, setQuoteIndex] = useState(
    () => Math.floor(Math.random() * workPrinciples.length),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setQuoteIndex((current) => (current + 1) % workPrinciples.length);
    }, 8_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md">
      <Quote aria-hidden="true" className="size-7 text-brand-red" strokeWidth={1.75} />
      <blockquote
        className="mt-5 text-xl leading-8 font-medium tracking-tight text-foreground"
        key={quoteIndex}
      >
        {workPrinciples[quoteIndex]}
      </blockquote>
      <div aria-hidden="true" className="mt-7 flex gap-2">
        {workPrinciples.map((principle, index) => (
          <span
            className={
              index === quoteIndex
                ? "h-1 w-8 bg-primary transition-all"
                : "h-1 w-3 bg-border transition-all"
            }
            key={principle}
          />
        ))}
      </div>
    </div>
  );
}

export function LoginPage() {
  const brandingQuery = useQuery({
    queryKey: publicBrandingQueryKey,
    queryFn: fetchPublicBranding,
    retry: 1,
    staleTime: 5 * 60_000,
  });

  const branding = brandingQuery.data ?? fallbackBranding;

  return (
    <main className="min-h-svh bg-background">
      <div className="grid min-h-svh w-full lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <section className="flex min-h-[44svh] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-svh lg:px-14 xl:px-20">
          <div className="w-full max-w-lg">
            <PublicBrandMark branding={branding} />
            <div className="mt-7">
              <p className="text-xl font-semibold tracking-tight text-foreground">
                {branding.organization_name}
              </p>
              <p className="mt-1 text-sm font-medium text-primary">
                {branding.site_name}
              </p>
            </div>

            <div className="mt-14 lg:mt-20">
              <RotatingQuote />
            </div>
          </div>
        </section>

        <div className="px-6 lg:hidden">
          <Separator className="bg-primary/15" />
        </div>

        <div className="relative hidden items-center justify-center px-8 lg:flex">
          <div className="relative h-[58vh] min-h-96 max-h-[36rem]">
            <span className="absolute top-0 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-brand-red bg-background" />
            <Separator
              className="h-full bg-primary/20"
              orientation="vertical"
            />
            <span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-1/2 rotate-45 border border-brand-red bg-background" />
          </div>
        </div>

        <section className="flex min-h-[56svh] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-svh lg:px-14 xl:px-20">
          <LoginForm siteName={branding.site_name} />
        </section>
      </div>
    </main>
  );
}
