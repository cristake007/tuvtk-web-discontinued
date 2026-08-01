import { PageMessageFrame } from "@/components/PageMessageFrame";

export function NotFoundPage() {
  return (
    <PageMessageFrame
      context="Eroare 404"
      description="Ruta solicitată nu există în aplicație."
      title="Pagina nu a fost găsită"
    />
  );
}
