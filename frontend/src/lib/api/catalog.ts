import { supabase } from "@/lib/supabase";
import type {
  DbCatalogTeam,
  DbCatalogColor,
  DbCatalogSize,
  DbCatalogShippingMethod,
} from "@/lib/database.types";

export async function getCatalogTeams(): Promise<DbCatalogTeam[]> {
  const { data, error } = await supabase
    .from("catalog_teams")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getCatalogColors(): Promise<DbCatalogColor[]> {
  const { data, error } = await supabase
    .from("catalog_colors")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getCatalogSizes(): Promise<DbCatalogSize[]> {
  const { data, error } = await supabase
    .from("catalog_sizes")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getCatalogShippingMethods(): Promise<DbCatalogShippingMethod[]> {
  const { data, error } = await supabase
    .from("catalog_shipping_methods")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// --- Mutations ---
export async function createCatalogTeam(name: string): Promise<void> {
  const { error } = await supabase.from("catalog_teams").insert({ name, is_active: true });
  if (error) throw error;
}
export async function deleteCatalogTeam(id: number): Promise<void> {
  const { error } = await supabase.from("catalog_teams").delete().eq("id", id);
  if (error) throw error;
}

export async function createCatalogColor(name: string, hex_color?: string): Promise<void> {
  const { error } = await supabase
    .from("catalog_colors")
    .insert({ name, hex_color: hex_color || null, is_active: true });
  if (error) throw error;
}
export async function deleteCatalogColor(id: number): Promise<void> {
  const { error } = await supabase.from("catalog_colors").delete().eq("id", id);
  if (error) throw error;
}

export async function createCatalogSize(name: string, sort_order?: number): Promise<void> {
  const { data } = await supabase
    .from("catalog_sizes")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  const next = sort_order ?? (data ? data.sort_order + 1 : 1);
  const { error } = await supabase
    .from("catalog_sizes")
    .insert({ name, sort_order: next, is_active: true });
  if (error) throw error;
}
export async function deleteCatalogSize(id: number): Promise<void> {
  const { error } = await supabase.from("catalog_sizes").delete().eq("id", id);
  if (error) throw error;
}

export async function createCatalogShippingMethod(name: string): Promise<void> {
  const { error } = await supabase
    .from("catalog_shipping_methods")
    .insert({ name, is_active: true });
  if (error) throw error;
}
export async function deleteCatalogShippingMethod(id: number): Promise<void> {
  const { error } = await supabase.from("catalog_shipping_methods").delete().eq("id", id);
  if (error) throw error;
}
