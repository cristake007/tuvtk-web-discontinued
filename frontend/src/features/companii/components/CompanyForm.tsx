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

import { fetchOwners } from "../api";
import { companyQueryKeys } from "../queryKeys";
import type { Company, CompanyWrite } from "../types";

const emptyValues: CompanyWrite = {
  name: "",
  legal_name: "",
  cui: null,
  trade_registry_number: "",
  vat_status: "TVA_NEPLATITOR",
  status: "PROSPECT",
  website: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  county: "",
  postal_code: "",
  country: "România",
  owner: null,
  notes: "",
};

export function CompanyForm({
  company,
  pending,
  onSubmit,
}: {
  company?: Company;
  pending: boolean;
  onSubmit: (values: CompanyWrite) => void;
}) {
  const [values, setValues] = useState<CompanyWrite>(
    company
      ? {
          name: company.name,
          legal_name: company.legal_name,
          cui: company.cui,
          trade_registry_number: company.trade_registry_number,
          vat_status: company.vat_status,
          status: company.status,
          website: company.website,
          email: company.email,
          phone: company.phone,
          street: company.street,
          city: company.city,
          county: company.county,
          postal_code: company.postal_code,
          country: company.country,
          owner: company.owner,
          notes: company.notes,
        }
      : emptyValues,
  );
  const [error, setError] = useState("");
  const owners = useQuery({ queryKey: companyQueryKeys.owners, queryFn: fetchOwners });
  const update = (field: keyof CompanyWrite, value: string | number | null) =>
    setValues((current) => ({ ...current, [field]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) return setError("Numele companiei este obligatoriu.");
    if (values.cui && !/^(?:ro)?\s*\d+(?:\s*\d+)*$/i.test(values.cui))
      return setError("CUI-ul poate conține doar cifre și prefixul RO.");
    setError("");
    onSubmit({ ...values, name: values.name.trim() });
  }

  const fields: Array<[keyof CompanyWrite, string, string]> = [
    ["name", "Nume companie", "text"],
    ["legal_name", "Denumire juridică", "text"],
    ["cui", "CUI", "text"],
    ["trade_registry_number", "Nr. registrul comerțului", "text"],
    ["website", "Website", "url"],
    ["email", "E-mail general", "email"],
    ["phone", "Telefon", "tel"],
    ["street", "Stradă", "text"],
    ["city", "Localitate", "text"],
    ["county", "Județ", "text"],
    ["postal_code", "Cod poștal", "text"],
    ["country", "Țară", "text"],
  ];
  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader>
          <CardTitle>{company ? "Editează compania" : "Adaugă companie"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {fields.map(([field, label, type]) => (
            <div className="grid gap-2" key={field}>
              <Label htmlFor={`company-${field}`}>
                {label}
                {field === "name" ? " *" : ""}
              </Label>
              <Input
                id={`company-${field}`}
                type={type}
                value={(values[field] as string) ?? ""}
                onChange={(event) =>
                  update(field, event.target.value || (field === "cui" ? null : ""))
                }
              />
            </div>
          ))}
          <div className="grid gap-2">
            <Label>Statut</Label>
            <Select value={values.status} onValueChange={(value) => update("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIV">Activ</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="INACTIV">Inactiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Statut TVA</Label>
            <Select
              value={values.vat_status}
              onValueChange={(value) => update("vat_status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TVA_PLATITOR">Plătitor de TVA</SelectItem>
                <SelectItem value="TVA_NEPLATITOR">Neplătitor de TVA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Responsabil</Label>
            <Select
              value={values.owner ? String(values.owner) : "none"}
              onValueChange={(value) => update("owner", value === "none" ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fără responsabil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Fără responsabil</SelectItem>
                {owners.data?.map((owner) => (
                  <SelectItem key={owner.id} value={String(owner.id)}>
                    {owner.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="company-notes">Note interne</Label>
            <Textarea
              id="company-notes"
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
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
