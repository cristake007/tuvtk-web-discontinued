import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/features/auth/LoginForm";
import {
  fallbackLoginQuotes,
  fetchRomanianLoginQuotes,
} from "@/features/auth/loginQuotes";
import { PublicBrandMark } from "@/features/branding/PublicBrandMark";
import type { PublicBranding } from "@/features/branding/types";

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
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [quotes.length]);

  const quote = quotes[quoteIndex] ?? fallbackLoginQuotes[0];

  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <div className="flex items-start justify-center gap-2.5">
        <Quote
          aria-hidden="true"
          className="mt-1 size-3.5 shrink-0 fill-brand-red text-brand-red"
          strokeWidth={1.5}
        />
        <blockquote
          className="max-w-sm text-sm leading-6 font-medium tracking-tight text-foreground"
          key={quote.text}
        >
          {quote.text}
        </blockquote>
        <Quote
          aria-hidden="true"
          className="mt-1 size-3.5 shrink-0 rotate-180 fill-brand-red text-brand-red"
          strokeWidth={1.5}
        />
      </div>
      <cite className="mt-3 text-xs font-medium not-italic text-primary/75">
        {quote.attribution}
      </cite>
    </div>
  );
}

export function LoginPage({ branding }: { branding: PublicBranding }) {
  return (
    <main className="relative min-h-svh bg-background">
      <div className="grid min-h-svh w-full lg:grid-cols-2">
        <section className="flex min-h-[44svh] items-center justify-center px-6 py-10 sm:px-10 lg:min-h-svh lg:px-12 xl:px-16">
          <div className="w-full max-w-md text-center">
            <PublicBrandMark branding={branding} className="mx-auto" compact />
            <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">
              {branding.organization_name}
            </p>

            <div className="mt-10 lg:mt-14">
              <RotatingQuote />
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-xl px-6 lg:hidden">
          <Separator
            className="bg-transparent"
            style={{
              background:
                "linear-gradient(to right, transparent 0%, rgb(22 65 148 / 0.45) 20%, #164194 50%, rgb(22 65 148 / 0.45) 80%, transparent 100%)",
            }}
          />
        </div>

        <section className="flex min-h-[56svh] items-center justify-center px-6 py-10 sm:px-10 lg:min-h-svh lg:px-12 xl:px-16">
          <LoginForm />
        </section>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center lg:flex">
        <div className="h-[60vh] min-h-[26rem] max-h-[38rem] w-[3px]">
          <Separator
            className="h-full w-[3px] bg-transparent"
            orientation="vertical"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgb(22 65 148 / 0.34) 12%, #164194 30%, #164194 70%, rgb(22 65 148 / 0.34) 88%, transparent 100%)",
              clipPath:
                "polygon(50% 0%, 100% 14%, 100% 86%, 50% 100%, 0% 86%, 0% 14%)",
              filter:
                "drop-shadow(0 0 3px rgb(22 65 148 / 0.24)) drop-shadow(0 0 8px rgb(22 65 148 / 0.12))",
            }}
          />
        </div>
      </div>
    </main>
  );
}
