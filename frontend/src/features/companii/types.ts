export type CompanyStatus = "ACTIV" | "PROSPECT" | "INACTIV";
export type VatStatus = "TVA_PLATITOR" | "TVA_NEPLATITOR";

export type Owner = { id: number; display_name: string };

export type Company = {
  id: number;
  name: string;
  legal_name: string;
  cui: string | null;
  trade_registry_number: string;
  vat_status: VatStatus;
  vat_status_label: string;
  status: CompanyStatus;
  status_label: string;
  website: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  county: string;
  postal_code: string;
  country: string;
  owner: number | null;
  owner_detail: Owner | null;
  notes: string;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyWrite = Omit<
  Company,
  | "id"
  | "status_label"
  | "vat_status_label"
  | "owner_detail"
  | "is_archived"
  | "archived_at"
  | "created_at"
  | "updated_at"
>;

export type CompanyList = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Company[];
};

export type CompanyFilters = {
  page: number;
  search: string;
  status: CompanyStatus | "all";
  vatStatus: VatStatus | "all";
  owner: number | "all";
  archived: boolean;
  ordering: string;
};
