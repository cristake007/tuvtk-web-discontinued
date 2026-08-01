import { WorkflowPage } from "@/components/WorkflowPage";
import { UpdateWordPressPanel } from "@/features/update-wordpress/UpdateWordPressPanel";

export function UpdateWordPressPage() {
  return (
    <WorkflowPage ariaLabel="Actualizare date cursuri în WordPress">
      <UpdateWordPressPanel />
    </WorkflowPage>
  );
}
