import type { ReactNode } from "react";

type StaticCatalogPageProps = {
  children: ReactNode;
};

/**
 * Contract pentru cataloage construite exclusiv din configurație locală.
 * Loading și error nu se aplică până când sursa catalogului devine asincronă;
 * fiecare catalog își păstrează starea empty în conținutul propriu.
 */
export function StaticCatalogPage({ children }: StaticCatalogPageProps) {
  return (
    <section
      className="flex min-w-0 flex-1 flex-col gap-6"
      data-state-contract="static-catalog"
    >
      {children}
    </section>
  );
}
