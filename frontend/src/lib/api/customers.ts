import { supabase } from "@/lib/supabase";

export type CustomerRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  price_table_id: number | null;
  price_table: { id: number; name: string } | null;
  orders: Array<{ count: number }>;
  customer_price_rules: Array<{ count: number }>;
};

export async function getCustomers(): Promise<CustomerRow[]> {
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, name, email, phone, document, city, state, is_active, price_table_id, price_table:price_tables(id, name), orders(count), customer_price_rules(count)",
    )
    .order("name");

  if (error) throw error;
  return (data ?? []) as unknown as CustomerRow[];
}

export type CustomerInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  city?: string | null;
  state?: string | null;
  is_active?: boolean;
  price_table_id?: number | null;
};

export async function createCustomer(input: CustomerInput): Promise<void> {
  const { error } = await supabase.from("customers").insert(input);
  if (error) throw error;
}

export async function updateCustomer(id: number, input: Partial<CustomerInput>): Promise<void> {
  const { error } = await supabase.from("customers").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: number): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}
