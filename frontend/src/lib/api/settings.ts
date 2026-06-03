import { supabase } from "@/lib/supabase";

// ── App settings (key-value) ──────────────────────────────────────────────

export type AppSettings = Record<string, string>;

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from("app_settings").select("key, value");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? ""]));
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

// ── Price tables ──────────────────────────────────────────────────────────

export type PriceTable = {
  id: number;
  name: string;
  description: string | null;
};

export type PriceTableItem = {
  id: number;
  table_id: number;
  service_name: string;
  unit_price: number;
};

export async function getPriceTables(): Promise<PriceTable[]> {
  const { data, error } = await supabase
    .from("price_tables")
    .select("id, name, description")
    .order("name");
  if (error) throw error;
  return (data ?? []) as PriceTable[];
}

export async function createPriceTable(name: string, description?: string): Promise<PriceTable> {
  const { data, error } = await supabase
    .from("price_tables")
    .insert({ name: name.trim(), description: description?.trim() || null })
    .select("id, name, description")
    .single();
  if (error) throw error;
  return data as PriceTable;
}

export async function updatePriceTable(
  id: number,
  name: string,
  description?: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("price_tables")
    .update({ name: name.trim(), description: description?.trim() || null })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePriceTable(id: number): Promise<void> {
  const { error } = await supabase.from("price_tables").delete().eq("id", id);
  if (error) throw error;
}

export async function getPriceTableItems(tableId: number): Promise<PriceTableItem[]> {
  const { data, error } = await supabase
    .from("price_table_items")
    .select("id, table_id, service_name, unit_price")
    .eq("table_id", tableId)
    .order("service_name");
  if (error) throw error;
  return (data ?? []) as PriceTableItem[];
}

export async function upsertPriceTableItem(
  tableId: number,
  serviceName: string,
  unitPrice: number,
): Promise<void> {
  const { error } = await supabase
    .from("price_table_items")
    .upsert(
      { table_id: tableId, service_name: serviceName.trim(), unit_price: unitPrice },
      { onConflict: "table_id,service_name" },
    );
  if (error) throw error;
}

export async function deletePriceTableItem(id: number): Promise<void> {
  const { error } = await supabase.from("price_table_items").delete().eq("id", id);
  if (error) throw error;
}
