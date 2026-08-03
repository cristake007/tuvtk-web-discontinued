import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { archiveContact, restoreContact } from "../api";
import { contactQueryKeys } from "../queryKeys";
import type { Contact } from "../types";
export function ContactDetail({ contact }: { contact: Contact }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const toggle = useMutation({
    mutationFn: () =>
      contact.is_archived ? restoreContact(contact.id) : archiveContact(contact.id),
    onSuccess: (updated) => {
      client.setQueryData(contactQueryKeys.detail(contact.id), updated);
      void client.invalidateQueries({ queryKey: contactQueryKeys.all });
      toast.success(
        updated.is_archived ? "Contactul a fost arhivat." : "Contactul a fost restaurat.",
      );
      setOpen(false);
    },
    onError: () =>
      toast.error(
        contact.is_archived
          ? "Contactul nu a putut fi restaurat."
          : "Contactul nu a putut fi arhivat.",
      ),
  });
  const rows = [
    ["Companie", contact.company_detail.name],
    ["Funcție", contact.job_title],
    ["Statut", contact.status_label],
    ["Responsabil", contact.owner_detail?.display_name],
    ["E-mail", contact.email],
    ["Telefon", contact.phone],
    ["Telefon mobil", contact.mobile_phone],
  ];
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="link" className="px-0" onClick={() => navigate("/crm/contacte")}>
            ← Înapoi la contacte
          </Button>
          <PageTitle>
            {contact.first_name} {contact.last_name}
          </PageTitle>
          <Text className="text-muted-foreground">
            {contact.is_archived ? "Contact arhivat" : contact.status_label}
          </Text>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/crm/contacte/${contact.id}/editare`)}>
            Editează
          </Button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
              render={<Button variant={contact.is_archived ? "default" : "destructive"} />}
            >
              {contact.is_archived ? <RotateCcw /> : <Archive />}
              {contact.is_archived ? "Restaurează" : "Arhivează"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {contact.is_archived ? "Restaurezi contactul?" : "Arhivezi contactul?"}
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
          <CardTitle>Detalii contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <Text className="text-muted-foreground">{label}</Text>
              <p>{value || "—"}</p>
            </div>
          ))}
          {contact.notes ? (
            <div className="md:col-span-2">
              <Text className="text-muted-foreground">Note interne</Text>
              <p className="whitespace-pre-wrap">{contact.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
