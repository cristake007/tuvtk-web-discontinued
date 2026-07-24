import { Card } from "@/components/ui/card";
import { CoursePlannerPanel } from "@/features/course-planner/CoursePlannerPanel";

export function CoursePlannerPage() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-1 overflow-hidden">
      <Card className="relative z-10 m-5 min-w-0 flex-1 border-border/70 bg-card shadow-sm sm:m-7 lg:m-9">
        <CoursePlannerPanel />
      </Card>
    </section>
  );
}
