import type { ReactNode } from "react";

type WorkflowPageProps = {
  ariaLabel: string;
  children: ReactNode;
};

/**
 * Contract comun pentru workflow-uri: query-urile blocante folosesc
 * QueryApplicationState în panoul proprietar, operațiile afișează pending în
 * controlul care le pornește și erorile prin toast, iar lipsa inputului sau a
 * rezultatului folosește empty state-ul comun.
 */
export function WorkflowPage({ ariaLabel, children }: WorkflowPageProps) {
  return (
    <section aria-label={ariaLabel} className="relative flex min-h-full min-w-0 flex-1">
      {children}
    </section>
  );
}
