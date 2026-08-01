import { WorkflowPage } from "@/components/WorkflowPage";
import { WordMatcherPanel } from "@/features/course-planner/WordMatcherPanel";

export function CoursePlannerWordMatcherPage() {
  return (
    <WorkflowPage ariaLabel="Potrivire document Word cu programul cursurilor">
      <WordMatcherPanel />
    </WorkflowPage>
  );
}
