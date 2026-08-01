import { Monitor } from "lucide-react";

import { AdminPageHeader } from "@/features/administration/AdminPageHeader";

export function AdministrationUserInterfaceHeader() {
  return (
    <AdminPageHeader
      crumbs={[
        { href: "/administrare", label: "Administrare" },
        { label: "Interfață utilizator" },
      ]}
      description="Configurează identitatea vizuală și opțiunile de prezentare ale platformei."
      icon={Monitor}
      title="Interfață utilizator"
    />
  );
}
