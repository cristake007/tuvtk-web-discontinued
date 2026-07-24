import { Card } from "@/components/ui/card";

export function DashboardPage() {
  return (
    <section className="dashboard-grid relative flex min-h-[calc(100svh-8rem)] flex-1 items-stretch justify-center overflow-hidden rounded-md border border-border/60 p-4 sm:p-6 lg:p-8">
      <Card
        aria-label="Dashboard content"
        className="relative z-10 min-h-[30rem] w-full max-w-screen-xl flex-1 border-border/70 bg-card/95 shadow-sm backdrop-blur-[2px]"
      />
    </section>
  );
}
