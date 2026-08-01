import type { LucideIcon } from "lucide-react";

import { ContentEmptyState } from "@/components/ContentEmptyState";

type WorkflowEmptyStateProps = {
  description: string;
  icon: LucideIcon;
  title: string;
};

export function WorkflowEmptyState({
  description,
  icon: Icon,
  title,
}: WorkflowEmptyStateProps) {
  return (
    <ContentEmptyState
      className="border bg-muted/10"
      description={description}
      icon={Icon}
      title={title}
    />
  );
}
