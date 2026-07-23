import { Construction } from "lucide-react";

export function ModulePlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="page-stack">
      <article className="empty-state">
        <div className="empty-state-icon">
          <Construction size={28} />
        </div>
        <span className="section-label">Module placeholder</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </article>
    </section>
  );
}
