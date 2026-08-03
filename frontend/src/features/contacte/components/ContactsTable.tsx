import { Users } from "lucide-react";
import { useNavigate } from "react-router";

import { ContentEmptyState } from "@/components/ContentEmptyState";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Contact } from "../types";

export function ContactsTable({
  contacts,
  emptyDescription,
  showCompany = true,
}: {
  contacts: Contact[];
  emptyDescription: string;
  showCompany?: boolean;
}) {
  const navigate = useNavigate();
  if (!contacts.length)
    return (
      <ContentEmptyState icon={Users} title="Nu există contacte" description={emptyDescription} />
    );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contact</TableHead>
          {showCompany ? <TableHead>Companie</TableHead> : null}
          <TableHead>Funcție</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Contact</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => (
          <TableRow
            className="cursor-pointer"
            key={contact.id}
            onClick={() => navigate(`/crm/contacte/${contact.id}`)}
          >
            <TableCell className="font-medium">
              {contact.first_name} {contact.last_name}
            </TableCell>
            {showCompany ? <TableCell>{contact.company_detail?.name ?? "Fără companie"}</TableCell> : null}
            <TableCell>{contact.job_title || "—"}</TableCell>
            <TableCell>
              <Badge variant={contact.is_archived ? "outline" : "secondary"}>
                {contact.is_archived ? "Arhivat" : contact.status_label}
              </Badge>
            </TableCell>
            <TableCell>{contact.email || contact.mobile_phone || contact.phone || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
