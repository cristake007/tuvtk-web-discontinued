import type { LucideIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

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
    <Empty className="border bg-muted/10 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
