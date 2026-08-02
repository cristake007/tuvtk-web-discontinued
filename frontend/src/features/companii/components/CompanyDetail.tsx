import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, RotateCcw, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { ContentEmptyState } from "@/components/ContentEmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { archiveCompany, restoreCompany } from "../api";
import { companyQueryKeys } from "../queryKeys";
import type { Company } from "../types";

export function CompanyDetail({ company }: { company: Company }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const toggle = useMutation({
    mutationFn: () =>
      company.is_archived ? restoreCompany(company.id) : archiveCompany(company.id),
    onSuccess: (updated) => {
      client.setQueryData(companyQueryKeys.detail(company.id), updated);
      void client.invalidateQueries({ queryKey: companyQueryKeys.all });
      toast.success(
        updated.is_archived ? "Compania a fost arhivată." : "Compania a fost restaurată.",
      );
    },
  });
  const rows = [
    ["Denumire juridică", company.legal_name],
    ["CUI", company.cui],
    ["Registrul comerțului", company.trade_registry_number],
    ["Statut TVA", company.vat_status_label],
    ["Responsabil", company.owner_detail?.display_name],
    ["E-mail", company.email],
    ["Telefon", company.phone],
    ["Website", company.website],
    [
      "Adresă",
      [company.street, company.city, company.county, company.postal_code, company.country]
        .filter(Boolean)
        .join(", "),
    ],
  ];
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="link" className="px-0" onClick={() => navigate("/crm/companii")}>
            ← Înapoi la companii
          </Button>
          <PageTitle>{company.name}</PageTitle>
          <Text className="text-muted-foreground">
            {company.is_archived ? "Companie arhivată" : company.status_label}
          </Text>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/crm/companii/${company.id}/editare`)}>
            Editează
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant={company.is_archived ? "default" : "destructive"} />}
            >
              {company.is_archived ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <Archive aria-hidden="true" />
              )}
              {company.is_archived ? "Restaurează" : "Arhivează"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {company.is_archived ? "Restaurezi compania?" : "Arhivezi compania?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Înregistrarea rămâne disponibilă și poate fi restaurată ulterior.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Renunță</AlertDialogCancel>
                <AlertDialogAction disabled={toggle.isPending} onClick={() => toggle.mutate()}>
                  Confirmă
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalii companie</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <Text className="text-muted-foreground">{label}</Text>
              <p>{value || "—"}</p>
            </div>
          ))}
          {company.notes ? (
            <div className="md:col-span-2">
              <Text className="text-muted-foreground">Note interne</Text>
              <p className="whitespace-pre-wrap">{company.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contacte asociate</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentEmptyState
            icon={Users}
            title="Contactele vor apărea aici"
            description="Modulul Contacte nu este disponibil încă. Această secțiune va afișa contactele filtrate după companie."
          />
        </CardContent>
      </Card>
    </section>
  );
}
