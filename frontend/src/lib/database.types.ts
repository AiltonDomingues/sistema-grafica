// Raw types matching the Supabase schema exactly.
// These are used by the API layer; routes use the joined types exported from src/lib/api/*.

export type OrderStatus =
  | "NEW"
  | "IN_CREATION"
  | "WAITING_APPROVAL"
  | "READY_FOR_PRINT"
  | "PRINTING"
  | "FINISHED"
  | "DELIVERED"
  | "CANCELED";

export type PriceSource = "MANUAL" | "CUSTOMER_RULE" | "MIXED";

export type FileType =
  | "FINAL_ART"
  | "MOCKUP"
  | "PRINT_FILE"
  | "REFERENCE_IMAGE"
  | "RECEIPT"
  | "OTHER";

export interface DbRole {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DbProfile {
  id: string; // UUID — matches auth.users.id
  full_name: string;
  username: string | null;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCustomer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCatalogTeam {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface DbCatalogColor {
  id: number;
  name: string;
  hex_color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbCatalogSize {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DbCatalogShippingMethod {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface DbProduct {
  id: number;
  name: string;
  category: string | null;
  color_id: number | null;
  description: string | null;
  internal_code: string | null;
  base_cost: number | null;
  supplier_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: number;
  order_number: string;
  customer_id: number;
  order_date: string;
  shipping_method_id: number | null;
  shipping_notes: string | null;
  notes: string | null;
  status: OrderStatus;
  total_amount: number | null;
  price_source: PriceSource;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  team_id: number | null;
  color_id: number | null;
  size_id: number | null;
  customization_name: string | null;
  customization_number: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderFile {
  id: number;
  order_id: number;
  uploaded_by: number | null;
  file_type: FileType;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  notes: string | null;
  uploaded_at: string;
}
