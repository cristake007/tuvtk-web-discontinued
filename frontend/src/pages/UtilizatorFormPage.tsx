import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useAuthenticatedBootstrap } from "@/app/AuthenticatedBootstrapContext";
import { ApplicationState } from "@/components/ApplicationState";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import {
  createUtilizator,
  fetchAplicatiiGrup,
  fetchGrupuri,
  fetchUtilizator,
  updateUtilizator,
} from "@/features/utilizatori/api";
import { utilizatoriQueryKeys } from "@/features/utilizatori/queryKeys";
import type { UtilizatorWrite } from "@/features/utilizatori/types";
import { UtilizatorForm } from "@/features/utilizatori/UtilizatorDialog";
import { formatApiError } from "@/lib/api-errors";

export function UtilizatorFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useParams();
  const parsedUserId = userId ? Number(userId) : null;
  const editing = parsedUserId !== null && Number.isInteger(parsedUserId);
  const bootstrap = useAuthenticatedBootstrap();
  const groupsQuery = useQuery({ queryKey: utilizatoriQueryKeys.grupuri(), queryFn: fetchGrupuri });
  const applicationsQuery = useQuery({
    queryKey: [...utilizatoriQueryKeys.all, "aplicatii-acces"],
    queryFn: fetchAplicatiiGrup,
  });
  const userQuery = useQuery({
    queryKey: [...utilizatoriQueryKeys.all, "detaliu", parsedUserId],
    queryFn: () => fetchUtilizator(parsedUserId!),
    enabled: editing,
  });
  const saveMutation = useMutation({
    mutationFn: (values: UtilizatorWrite) =>
      editing ? updateUtilizator(parsedUserId!, values) : createUtilizator(values),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: utilizatoriQueryKeys.all });
      toast.success(editing ? "Utilizatorul a fost actualizat." : "Utilizatorul a fost creat.", {
        description: user.full_name,
      });
      navigate("/administrare/utilizatori");
    },
    onError: (error) => {
      toast.error(formatApiError(error, "Contul nu a putut fi salvat."));
    },
  });

  if (!editing && userId) {
    return <ApplicationState description="Identificatorul utilizatorului nu este valid." title="Utilizator indisponibil" />;
  }
  const queryPending = groupsQuery.isPending || applicationsQuery.isPending || (editing && userQuery.isPending);
  const queryError = groupsQuery.error ?? applicationsQuery.error ?? userQuery.error;
  if (queryPending || groupsQuery.isError || applicationsQuery.isError || userQuery.isError) {
    return (
      <QueryApplicationState
        error={queryError}
        errorDescription="Formularul utilizatorului nu a putut fi încărcat."
        errorTitle="Utilizator indisponibil"
        loading={queryPending}
        loadingDescription="Se încarcă formularul utilizatorului."
        loadingTitle="Se încarcă utilizatorul"
        onRetry={() => {
          void groupsQuery.refetch();
          void applicationsQuery.refetch();
          if (editing) {
            void userQuery.refetch();
          }
        }}
      />
    );
  }
  return (
    <UtilizatorForm
      applications={applicationsQuery.data}
      canManageStaff={Boolean(bootstrap.user?.is_superuser)}
      groups={groupsQuery.data}
      onCancel={() => navigate("/administrare/utilizatori")}
      onSubmit={(values) => saveMutation.mutate(values)}
      pending={saveMutation.isPending}
      user={editing ? userQuery.data ?? null : null}
    />
  );
}
