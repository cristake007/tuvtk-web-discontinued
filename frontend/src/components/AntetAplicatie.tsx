import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type AntetAplicatieProps = {
  pictograma: LucideIcon;
  titlu: string;
  actiuni?: ReactNode;
};

export function AntetAplicatie({
  pictograma: Pictograma,
  titlu,
  actiuni,
}: AntetAplicatieProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Pictograma aria-hidden="true" className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titlu}</h1>
      </div>
      {actiuni ? <div className="flex flex-wrap gap-2">{actiuni}</div> : null}
    </header>
  );
}
