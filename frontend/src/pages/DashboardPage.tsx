import { Card } from "@/components/ui/card";

const dashboardGridStyle = {
  backgroundColor: "var(--background)",
  backgroundImage:
    "linear-gradient(to bottom, color-mix(in srgb, var(--border) 62%, transparent) 1px, transparent 1px), repeating-linear-gradient(135deg, transparent 0, transparent 17px, color-mix(in srgb, var(--border) 52%, transparent) 17px, color-mix(in srgb, var(--border) 52%, transparent) 18px)",
  backgroundPosition: "0 -1px, 0 0",
  backgroundSize: "100% 50px, 48px 48px",
} as const;

export function DashboardPage() {
  return (
    <section
      className="relative flex min-h-[calc(100svh-4rem)] flex-1 overflow-hidden"
      style={dashboardGridStyle}
    >
      <Card
        aria-label="Dashboard content"
        className="relative z-10 m-5 min-h-[30rem] flex-1 border-border/70 bg-card shadow-sm sm:m-7 lg:m-9"
      />
    </section>
  );
}
