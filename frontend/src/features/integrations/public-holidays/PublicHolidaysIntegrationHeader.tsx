import { CalendarDays } from "lucide-react";

import { AdminPageHeader } from "@/features/administration/AdminPageHeader";

export function PublicHolidaysIntegrationHeader() {
  return (
    <AdminPageHeader
      crumbs={[
        { href: "/administrare", label: "Administrare" },
        { href: "/administrare/integrari", label: "Integrări" },
        { label: "Zile libere și sărbători" },
      ]}
      description="Configurează sincronizarea sărbătorilor legale și gestionează zilele interne utilizate în întreaga platformă."
      icon={CalendarDays}
      title="Zile libere și sărbători"
    />
  );
}
