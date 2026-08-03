import { Users } from "lucide-react";
import { useNavigate } from "react-router";
import { ContentEmptyState } from "@/components/ContentEmptyState";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
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
  if (query.isPending)
    return <Text className="text-muted-foreground">Se încarcă contactele companiei...</Text>;
  if (query.isError)
    return (
      <div className="flex items-center justify-between gap-3" role="alert">
        <Text>Contactele companiei nu au putut fi încărcate.</Text>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Reîncearcă
        </Button>
      </div>
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
