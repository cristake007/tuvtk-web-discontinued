import { useParams } from "react-router";

import { AdminPageHeader } from "@/features/administration/AdminPageHeader";

export function UtilizatorFormHeader() {
  const { userId } = useParams();
  const editing = userId !== undefined && Number.isInteger(Number(userId));

  return (
    <AdminPageHeader
      crumbs={[
        { href: "/administrare", label: "Administrare" },
        { href: "/administrare/utilizatori", label: "Utilizatori" },
        { label: editing ? "Editează" : "Adaugă" },
      ]}
      description={
        editing
          ? "Actualizează datele contului, starea și accesul administrativ."
          : "Creează un cont nou pentru accesul la platformă."
      }
      title={editing ? "Editează utilizatorul" : "Adaugă utilizator"}
    />
  );
}
