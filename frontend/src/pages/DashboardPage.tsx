import { useQuery } from "@tanstack/react-query";
import { Database, Search, ShieldCheck } from "lucide-react";

import { fetchHealth } from "../api/client";

export function DashboardPage() {
  const healthQuery = useQuery({
    queryKey: ["system-health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  const databases = healthQuery.data?.databases ?? {};

  return (
    <section className="page-stack">
      <div className="page-introduction">
        <div>
          <span className="section-label">Overview</span>
          <h2>Application foundation</h2>
          <p>
            React now owns the complete user interface. Django and Django Ninja provide
            identity, configuration, permissions, and business data through the API.
          </p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <div className="summary-icon">
            <Database size={21} />
          </div>
          <span>Core database</span>
          <strong>{databases.core?.status ?? "checking"}</strong>
          <small>Users, settings, navigation, and operational records</small>
        </article>

        <article className="summary-card">
          <div className="summary-icon">
            <Search size={21} />
          </div>
          <span>Registry database</span>
          <strong>{databases.registry?.status ?? "checking"}</strong>
          <small>ONRC companies and searchable reference information</small>
        </article>

        <article className="summary-card">
          <div className="summary-icon">
            <ShieldCheck size={21} />
          </div>
          <span>API status</span>
          <strong>{healthQuery.data?.status ?? "checking"}</strong>
          <small>Django Ninja versioned API at /api/v1/</small>
        </article>
      </div>

      <article className="content-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">Next module</span>
            <h3>Company Explorer</h3>
          </div>
        </div>
        <p>
          The shell is ready for the company directory, document editor, and other modules.
          Each module will own its React routes and its Django Ninja router.
        </p>
      </article>
    </section>
  );
}
