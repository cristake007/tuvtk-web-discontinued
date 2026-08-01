import type { ReactNode } from "react";

type WorkflowPageProps = {
  ariaLabel: string;
  children: ReactNode;
};

export function WorkflowPage({ ariaLabel, children }: WorkflowPageProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="relative flex min-h-full min-w-0 flex-1"
    >
      {children}
    </section>
  );
}
