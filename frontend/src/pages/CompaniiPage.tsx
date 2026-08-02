import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { QueryApplicationState } from "@/components/QueryApplicationState";
import { Button } from "@/components/ui/button";
import { createCompany, updateCompany } from "@/features/companii/api";
import { CompaniesPanel } from "@/features/companii/components/CompaniesPanel";
import { CompanyDetail } from "@/features/companii/components/CompanyDetail";
import { CompanyForm } from "@/features/companii/components/CompanyForm";
import { useCompany } from "@/features/companii/hooks/useCompany";
import { companyQueryKeys } from "@/features/companii/queryKeys";
import type { CompanyWrite } from "@/features/companii/types";

export function CompaniiPage() {
  return <CompaniesPanel />;
}

export function CompanieDetailPage() {
  const id = Number(useParams().companyId);
  const query = useCompany(id);
  if (!Number.isInteger(id)) return <Navigate replace to="/crm/companii" />;
  if (query.isPending || query.isError)
    return (
      <QueryApplicationState
        error={query.error}
        errorDescription="Compania nu a putut fi încărcată."
        errorTitle="Compania nu este disponibilă"
        loading={query.isPending}
        loadingDescription="Se încarcă datele companiei."
        loadingTitle="Se încarcă compania"
        onRetry={() => void query.refetch()}
      />
    );
  return <CompanyDetail company={query.data} />;
}

export function CompanieFormPage() {
  const rawId = useParams().companyId;
  const id = rawId ? Number(rawId) : null;
  const detail = useCompany(id ?? 0, id !== null);
  const navigate = useNavigate();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: CompanyWrite) => (id ? updateCompany(id, values) : createCompany(values)),
    onSuccess: (company) => {
      void client.invalidateQueries({ queryKey: companyQueryKeys.all });
      toast.success(id ? "Compania a fost actualizată." : "Compania a fost creată.");
      navigate(`/crm/companii/${company.id}`);
    },
  });
  if (id && (detail.isPending || detail.isError))
    return (
      <QueryApplicationState
        error={detail.error}
        errorDescription="Compania nu a putut fi încărcată."
        errorTitle="Compania nu este disponibilă"
        loading={detail.isPending}
        loadingDescription="Se încarcă formularul."
        loadingTitle="Se încarcă compania"
        onRetry={() => void detail.refetch()}
      />
    );
  return (
    <section className="flex flex-col gap-4">
      <ButtonBack onClick={() => navigate(id ? `/crm/companii/${id}` : "/crm/companii")} />
      <CompanyForm
        company={id ? detail.data : undefined}
        pending={mutation.isPending}
        onSubmit={(values) => mutation.mutate(values)}
      />
      {mutation.error ? (
        <p className="text-destructive" role="alert">
          Salvarea companiei a eșuat. Verifică datele introduse.
        </p>
      ) : null}
    </section>
  );
}

function ButtonBack({ onClick }: { onClick: () => void }) {
  return (
    <Button className="w-fit px-0" variant="link" onClick={onClick} type="button">
      ← Înapoi
    </Button>
  );
}
