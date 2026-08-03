import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchContactCompanies, fetchContactOwners } from "../api";
import { contactQueryKeys } from "../queryKeys";
import type { Contact, ContactWrite } from "../types";
const emptyValues: ContactWrite = {
  first_name: "",
  last_name: "",
  job_title: "",
  company: null,
  email: "",
  phone: "",
  mobile_phone: "",
  status: "ACTIV",
  owner: null,
  notes: "",
};
export function ContactForm({
  contact,
  pending,
  onSubmit,
}: {
  contact?: Contact;
  pending: boolean;
  onSubmit: (v: ContactWrite) => void;
}) {
  const [values, setValues] = useState<ContactWrite>(
    contact
      ? {
          first_name: contact.first_name,
          last_name: contact.last_name,
          job_title: contact.job_title,
          company: contact.company,
          email: contact.email,
          phone: contact.phone,
          mobile_phone: contact.mobile_phone,
          status: contact.status,
          owner: contact.owner,
          notes: contact.notes,
        }
      : emptyValues,
  );
  const [error, setError] = useState("");
  const companies = useQuery({
    queryKey: contactQueryKeys.companies,
    queryFn: fetchContactCompanies,
  });
  const owners = useQuery({ queryKey: contactQueryKeys.owners, queryFn: fetchContactOwners });
  const update = (field: keyof ContactWrite, value: string | number | null) =>
    setValues((v) => ({ ...v, [field]: value }));
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!values.first_name.trim()) return setError("Prenumele este obligatoriu.");
    if (!values.last_name.trim()) return setError("Numele este obligatoriu.");
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      return setError("Adresa de e-mail nu este validă.");
    setError("");
    onSubmit({
      ...values,
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
    });
  }
  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader>
          <CardTitle>{contact ? "Editează contactul" : "Adaugă contact"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            ["first_name", "Prenume *", "text"],
            ["last_name", "Nume *", "text"],
            ["job_title", "Funcție", "text"],
            ["email", "E-mail", "email"],
            ["phone", "Telefon", "tel"],
            ["mobile_phone", "Telefon mobil", "tel"],
          ].map(([field, label, type]) => (
            <div className="grid gap-2" key={field}>
              <Label htmlFor={`contact-${field}`}>{label}</Label>
              <Input
                id={`contact-${field}`}
                type={type}
                value={String(values[field as keyof ContactWrite] ?? "")}
                onChange={(e) => update(field as keyof ContactWrite, e.target.value)}
              />
            </div>
          ))}
          <div className="grid gap-2">
            <Label>Companie</Label>
            <Select
              value={values.company ? String(values.company) : "none"}
              onValueChange={(v) => update("company", v === "none" ? null : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectează compania" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Fără companie</SelectItem>
                {companies.data?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                    {c.is_archived ? " (arhivată)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Statut</Label>
            <Select value={values.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIV">Activ</SelectItem>
                <SelectItem value="INACTIV">Inactiv</SelectItem>
                <SelectItem value="FOST_ANGAJAT">Fost angajat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Responsabil</Label>
            <Select
              value={values.owner ? String(values.owner) : "none"}
              onValueChange={(v) => update("owner", v === "none" ? null : Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Fără responsabil</SelectItem>
                {owners.data?.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="contact-notes">Note interne</Label>
            <Textarea
              id="contact-notes"
              value={values.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-destructive md:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button disabled={pending} type="submit">
            {pending ? "Se salvează..." : "Salvează"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
