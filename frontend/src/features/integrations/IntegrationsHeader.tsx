import { AdminPageHeader } from "@/features/administration/AdminPageHeader";

export function IntegrationsHeader() {
  return (
    <AdminPageHeader
      crumbs={[{ href: "/administrare", label: "Administrare" }, { label: "Integrări" }]}
      description="Alege serviciul pe care vrei să îl configurezi. Fiecare integrare are propria pagină de configurare și sincronizare."
      title="Integrări"
    />
  );
}
