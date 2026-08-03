import type { Owner } from "@/features/companii/types";

export type ContactStatus = "ACTIV" | "INACTIV" | "FOST_ANGAJAT";
export type CompanyReference = { id: number; name: string; is_archived: boolean };
export type Contact = {
  id: number;
  first_name: string;
  last_name: string;
  job_title: string;
  company: number;
  company_detail: CompanyReference;
  email: string;
  phone: string;
  mobile_phone: string;
  status: ContactStatus;
  status_label: string;
  owner: number | null;
  owner_detail: Owner | null;
  notes: string;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};
export type ContactWrite = Omit<
  Contact,
  | "id"
  | "company_detail"
  | "status_label"
  | "owner_detail"
  | "is_archived"
  | "archived_at"
  | "created_at"
  | "updated_at"
>;
export type ContactList = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Contact[];
};
export type ContactFilters = {
  page: number;
  search: string;
  company: number | "all";
  status: ContactStatus | "all";
  owner: number | "all";
  archived: boolean;
  ordering: string;
};
