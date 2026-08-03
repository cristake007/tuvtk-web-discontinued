import { Users } from "lucide-react";
import { useNavigate } from "react-router";
import { ContentEmptyState } from "@/components/ContentEmptyState";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContactsByCompany } from "../hooks/useContactsByCompany";
export function ContactsByCompany({ companyId }: { companyId: number }) {
  const query = useContactsByCompany(companyId);
  const navigate = useNavigate();
  if (query.isPending || query.isError)
    return (
      <QueryApplicationState
        error={query.error}
        errorDescription="Contactele companiei nu au putut fi încărcate."
        errorTitle="Contactele nu sunt disponibile"
        loading={query.isPending}
        loadingDescription="Se încarcă contactele companiei."
        loadingTitle="Se încarcă contactele"
        onRetry={() => void query.refetch()}
      />
    );
  if (!query.data.results.length)
    return (
      <ContentEmptyState
        icon={Users}
        title="Nu există contacte"
        description="Compania nu are contacte active asociate."
      />
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contact</TableHead>
          <TableHead>Funcție</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Telefon</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {query.data.results.map((contact) => (
          <TableRow
            className="cursor-pointer"
            key={contact.id}
            onClick={() => navigate(`/crm/contacte/${contact.id}`)}
          >
            <TableCell className="font-medium">
              {contact.first_name} {contact.last_name}
            </TableCell>
            <TableCell>{contact.job_title || "—"}</TableCell>
            <TableCell>{contact.email || "—"}</TableCell>
            <TableCell>{contact.mobile_phone || contact.phone || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
