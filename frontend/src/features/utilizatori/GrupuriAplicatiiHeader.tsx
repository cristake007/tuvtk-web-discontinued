import { AdminPageHeader } from "@/features/administration/AdminPageHeader";

export function GrupuriAplicatiiHeader() {
  return (
    <AdminPageHeader
      crumbs={[
        { href: "/administrare", label: "Administrare" },
        { label: "Grupuri și acces aplicații" },
      ]}
      description="Creează grupuri, atribuie utilizatori și stabilește aplicațiile disponibile."
      title="Grupuri și acces aplicații"
    />
  );
}
