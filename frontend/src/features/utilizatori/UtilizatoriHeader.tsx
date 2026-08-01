import { AdminPageHeader } from "@/features/administration/AdminPageHeader";

export function UtilizatoriHeader() {
  return (
    <AdminPageHeader
      crumbs={[{ href: "/administrare", label: "Administrare" }, { label: "Utilizatori" }]}
      description="Gestionează conturile care se pot autentifica în platformă, starea lor și accesul administrativ."
      title="Utilizatori"
    />
  );
}
