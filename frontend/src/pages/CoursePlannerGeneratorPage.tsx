import { WorkflowPage } from "@/components/WorkflowPage";
import { CoursePlannerPanel } from "@/features/course-planner/CoursePlannerPanel";

export function CoursePlannerGeneratorPage() {
  return (
    <WorkflowPage ariaLabel="Generator planificator cursuri">
      <CoursePlannerPanel />
    </WorkflowPage>
  );
}
