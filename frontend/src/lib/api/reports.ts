import { supabase } from "@/lib/supabase";
import type { OrderRow } from "./orders";

export type ReportPeriod = "day" | "week" | "month";

export function getPeriodRange(period: ReportPeriod): { from: string; to: string; label: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);

  if (period === "day") {
    return { from: to, to, label: "Hoje" };
  }
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().slice(0, 10), to, label: "Últimos 7 dias" };
  }
  const d = new Date(now);
  d.setDate(d.getDate() - 29);
  return { from: d.toISOString().slice(0, 10), to, label: "Últimos 30 dias" };
}

export async function getOrdersForReport(period: ReportPeriod): Promise<OrderRow[]> {
  const { from, to } = getPeriodRange(period);

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
    .gte("order_date", from)
    .lte("order_date", to)
    .order("order_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}
