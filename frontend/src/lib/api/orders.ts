import { supabase } from "@/lib/supabase";
import type { OrderStatus } from "@/lib/database.types";

export type OrderItemRow = {
  id: number;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  customization_name: string | null;
  customization_number: string | null;
  product: { id: number; name: string } | null;
  team: { id: number; name: string } | null;
  color: { id: number; name: string } | null;
  size: { id: number; name: string } | null;
};

export type OrderRow = {
  id: number;
  order_number: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number | null;
  notes: string | null;
  customer: { id: number; name: string } | null;
  shipping_method: { id: number; name: string } | null;
  items: OrderItemRow[];
};

export async function getOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      order_date,
      status,
      total_amount,
      notes,
      customer:customers(id, name),
      shipping_method:catalog_shipping_methods(id, name),
      items:order_items(
        id,
        quantity,
        unit_price,
        total_price,
        customization_name,
        customization_number,
        product:products(id, name),
        team:catalog_teams(id, name),
        color:catalog_colors(id, name),
        size:catalog_sizes(id, name)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}

export async function getOrderStatusCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("orders").select("status");
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}

export type OrderItemInput = {
  product_id: number | null;
  team_id: number | null;
  color_id: number | null;
  size_id: number | null;
  quantity: number;
  unit_price: number | null;
  customization_name: string | null;
  customization_number: string | null;
};

export type OrderInput = {
  customer_id: number;
  shipping_method_id: number | null;
  order_date: string;
  notes: string | null;
  items: OrderItemInput[];
};

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `PD-${y}${m}${d}-${rand}`;
}

export async function createOrder(input: OrderInput): Promise<void> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      customer_id: input.customer_id,
      shipping_method_id: input.shipping_method_id,
      order_date: input.order_date,
      notes: input.notes,
      status: "NEW" as OrderStatus,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (input.items.length > 0) {
    const rows = input.items.map((item) => ({
      order_id: data.id,
      product_id: item.product_id,
      team_id: item.team_id,
      color_id: item.color_id,
      size_id: item.size_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price != null ? item.unit_price * item.quantity : null,
      customization_name: item.customization_name,
      customization_number: item.customization_number,
    }));
    const { error: itemsError } = await supabase.from("order_items").insert(rows);
    if (itemsError) throw itemsError;
  }
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteOrder(id: number): Promise<void> {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}
