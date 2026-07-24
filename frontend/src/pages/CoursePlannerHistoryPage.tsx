import { CoursePlanHistoryTable } from "@/features/course-planner/CoursePlanHistoryTable";

export function CoursePlannerHistoryPage() {
  return (
    <section aria-label="Istoric generări planificator cursuri" className="min-h-full">
      <CoursePlanHistoryTable />
    </section>
  );
}
