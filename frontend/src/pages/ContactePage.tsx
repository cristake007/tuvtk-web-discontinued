import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ApiError } from "@/api/http";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import { Button } from "@/components/ui/button";
import { createContact, updateContact } from "@/features/contacte/api";
import { ContactDetail } from "@/features/contacte/components/ContactDetail";
import { ContactForm } from "@/features/contacte/components/ContactForm";
import { ContactsPanel } from "@/features/contacte/components/ContactsPanel";
import { useContact } from "@/features/contacte/hooks/useContact";
import { contactQueryKeys } from "@/features/contacte/queryKeys";
import type { ContactWrite } from "@/features/contacte/types";
const parseId = (value: string | undefined) => {
  const id = Number(value);
  return value && Number.isInteger(id) && id > 0 ? id : null;
};
export function ContactePage() {
  return <ContactsPanel />;
}
export function ContactDetailPage() {
  const id = parseId(useParams().contactId);
  const query = useContact(id ?? 0, id !== null);
  if (id === null) return <Navigate replace to="/crm/contacte" />;
  if (query.isPending || query.isError)
    return (
      <QueryApplicationState
        error={query.error}
        errorDescription="Contactul nu a putut fi încărcat."
        errorTitle="Contactul nu este disponibil"
        loading={query.isPending}
        loadingDescription="Se încarcă datele contactului."
        loadingTitle="Se încarcă contactul"
        onRetry={() => void query.refetch()}
      />
    );
  return <ContactDetail contact={query.data} />;
}
export function ContactFormPage() {
  const rawId = useParams().contactId;
  const editing = rawId !== undefined;
  const id = parseId(rawId);
  const detail = useContact(id ?? 0, editing && id !== null);
  const navigate = useNavigate();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (v: ContactWrite) =>
      editing && id !== null ? updateContact(id, v) : createContact(v),
    onSuccess: (c) => {
      void client.invalidateQueries({ queryKey: contactQueryKeys.all });
      toast.success(editing ? "Contactul a fost actualizat." : "Contactul a fost creat.");
      navigate(`/crm/contacte/${c.id}`);
    },
  });
  if (editing && id === null) return <Navigate replace to="/crm/contacte" />;
  if (editing && (detail.isPending || detail.isError))
    return (
      <QueryApplicationState
        error={detail.error}
        errorDescription="Contactul nu a putut fi încărcat."
        errorTitle="Contactul nu este disponibil"
        loading={detail.isPending}
        loadingDescription="Se încarcă formularul."
        loadingTitle="Se încarcă contactul"
        onRetry={() => void detail.refetch()}
      />
    );
  return (
    <section className="flex flex-col gap-4">
      <Button
        className="w-fit px-0"
        variant="link"
        onClick={() => navigate(editing ? `/crm/contacte/${id}` : "/crm/contacte")}
      >
        ← Înapoi
      </Button>
      <ContactForm
        contact={editing ? detail.data : undefined}
        pending={mutation.isPending}
        onSubmit={(v) => mutation.mutate(v)}
      />
      {mutation.error ? (
        <p className="text-destructive" role="alert">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : "Salvarea contactului a eșuat. Încearcă din nou."}
        </p>
      ) : null}
    </section>
  );
}
