import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/features/auth/LoginForm";
import {
  fallbackLoginQuotes,
  fetchRomanianLoginQuotes,
} from "@/features/auth/loginQuotes";
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

function RotatingQuote() {
  const quotesQuery = useQuery({
    queryKey: ["login-quotes", "ro-wikiquote", "professional-authors"],
    queryFn: ({ signal }) => fetchRomanianLoginQuotes(signal),
    retry: 1,
    staleTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const quotes = quotesQuery.data?.length
    ? quotesQuery.data
    : fallbackLoginQuotes;
  const [quoteIndex, setQuoteIndex] = useState(
    () => Math.floor(Math.random() * quotes.length),
  );

  useEffect(() => {
    setQuoteIndex((current) => current % quotes.length);
  }, [quotes.length]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setQuoteIndex((current) => (current + 1) % quotes.length);
    }, 12_000);

    return () => window.clearInterval(interval);
  }, [quotes.length]);

  const quote = quotes[quoteIndex] ?? fallbackLoginQuotes[0];

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center text-center">
      <div className="flex items-start justify-center gap-3">
        <Quote
          aria-hidden="true"
          className="mt-1 size-4 shrink-0 fill-brand-red text-brand-red"
          strokeWidth={1.5}
        />
        <blockquote
          className="max-w-md text-base leading-7 font-medium tracking-tight text-foreground"
          key={quote.text}
        >
          {quote.text}
        </blockquote>
        <Quote
          aria-hidden="true"
          className="mt-1 size-4 shrink-0 rotate-180 fill-brand-red text-brand-red"
          strokeWidth={1.5}
        />
      </div>
      <cite className="mt-4 text-sm font-medium not-italic text-primary/75">
        {quote.attribution}
      </cite>
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
        <section className="flex min-h-[48svh] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-svh lg:px-14 xl:px-20">
          <div className="w-full max-w-xl text-center">
            <PublicBrandMark branding={branding} className="mx-auto" />
            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {branding.organization_name}
            </p>

            <div className="mt-16 lg:mt-24">
              <RotatingQuote />
            </div>
          </div>
        </section>

        <div className="px-6 lg:hidden">
          <Separator
            className="bg-transparent"
            style={{
              background:
                "linear-gradient(to right, transparent 0%, rgb(22 65 148 / 0.45) 20%, #164194 50%, rgb(22 65 148 / 0.45) 80%, transparent 100%)",
            }}
          />
        </div>

        <div className="relative hidden items-center justify-center px-8 lg:flex">
          <div className="h-[72vh] min-h-[32rem] max-h-[46rem] w-[5px]">
            <Separator
              className="h-full w-[5px] bg-transparent"
              orientation="vertical"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 0%, rgb(22 65 148 / 0.38) 12%, #164194 28%, #164194 72%, rgb(22 65 148 / 0.38) 88%, transparent 100%)",
                clipPath:
                  "polygon(50% 0%, 100% 14%, 100% 86%, 50% 100%, 0% 86%, 0% 14%)",
                filter:
                  "drop-shadow(0 0 4px rgb(22 65 148 / 0.32)) drop-shadow(0 0 10px rgb(22 65 148 / 0.16))",
              }}
            />
          </div>
        </div>

        <section className="flex min-h-[52svh] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-svh lg:px-14 xl:px-20">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
