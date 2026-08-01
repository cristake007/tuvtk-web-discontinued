import type { ReactNode } from "react";

import { PageTitle } from "@/components/ui/heading";

type AntetAplicatieProps = {
  titlu: string;
  actiuni?: ReactNode;
};

export function AntetAplicatie({ titlu, actiuni }: AntetAplicatieProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <PageTitle>{titlu}</PageTitle>
      {actiuni ? <div className="flex flex-wrap gap-2">{actiuni}</div> : null}
    </header>
  );
}
