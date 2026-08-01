import { WorkflowPage } from "@/components/WorkflowPage";
import { XmlFormatterPanel } from "@/features/course-planner/XmlFormatterPanel";

export function CoursePlannerXmlPage() {
  return (
    <WorkflowPage ariaLabel="Formatare XML cursuri">
      <XmlFormatterPanel />
    </WorkflowPage>
  );
}
