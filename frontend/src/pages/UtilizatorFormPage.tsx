import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { coreBootstrapQueryKey, fetchCoreBootstrap } from "@/api/core";
import { ApplicationState } from "@/components/ApplicationState";
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
  const bootstrapQuery = useQuery({ queryKey: coreBootstrapQueryKey, queryFn: fetchCoreBootstrap });
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
  if (groupsQuery.isPending || applicationsQuery.isPending || bootstrapQuery.isPending || (editing && userQuery.isPending)) {
    return <ApplicationState description="Se încarcă formularul utilizatorului." loading title="Se încarcă utilizatorul" />;
  }
  if (groupsQuery.isError || applicationsQuery.isError || bootstrapQuery.isError || userQuery.isError) {
    return <ApplicationState description="Formularul utilizatorului nu a putut fi încărcat." title="Utilizator indisponibil" />;
  }
  return (
    <UtilizatorForm
      applications={applicationsQuery.data}
      canManageStaff={Boolean(bootstrapQuery.data.user?.is_superuser)}
      groups={groupsQuery.data}
      onCancel={() => navigate("/administrare/utilizatori")}
      onSubmit={(values) => saveMutation.mutate(values)}
      pending={saveMutation.isPending}
      user={editing ? userQuery.data ?? null : null}
    />
  );
}
