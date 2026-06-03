import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Download,
  TrendingUp,
  Package,
  Users,
  XCircle,
  DollarSign,
} from "lucide-react";
import { getOrdersForReport, getPeriodRange, type ReportPeriod } from "@/lib/api/reports";
import type { OrderRow } from "@/lib/api/orders";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [{ title: "Gestor • Relatórios" }],
  }),
  component: RelatoriosPage,
});

// ── helpers ────────────────────────────────────────────────────────────────

const BR = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_PT: Record<string, string> = {
  NEW: "Novo",
  IN_CREATION: "Em criação",
  WAITING_APPROVAL: "Ag. aprovação",
  READY_FOR_PRINT: "P/ impressão",
  PRINTING: "Em impressão",
  FINISHED: "Finalizado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

function exportCsv(orders: OrderRow[], period: ReportPeriod) {
  const { from, to } = getPeriodRange(period);
  const rows: string[][] = [
    ["Pedido", "Data", "Cliente", "Status", "Produto(s)", "Qtd total", "Valor (R$)"],
    ...orders.map((o) => [
      o.order_number,
      new Date(o.order_date).toLocaleDateString("pt-BR"),
      o.customer?.name ?? "",
      STATUS_PT[o.status] ?? o.status,
      o.items.map((i) => i.product?.name ?? "—").join("; "),
      String(o.items.reduce((s, i) => s + i.quantity, 0)),
      (o.total_amount ?? 0).toFixed(2).replace(".", ","),
    ]),
  ];
  const csv = rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio_${from}_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── page ───────────────────────────────────────────────────────────────────

function RelatoriosPage() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getOrdersForReport(period)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  // Computed metrics
  const activeOrders = orders.filter((o) => o.status !== "CANCELED");
  const totalRevenue = activeOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const avgTicket = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;
  const canceledCount = orders.filter((o) => o.status === "CANCELED").length;
  const cancelRate = orders.length > 0 ? (canceledCount / orders.length) * 100 : 0;

  // Orders by status
  const byStatus: Record<string, number> = {};
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  }

  // Top products (by quantity, excluding canceled)
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const o of activeOrders) {
    for (const item of o.items) {
      const name = item.product?.name ?? "Sem produto";
      if (!productMap[name]) productMap[name] = { name, qty: 0, revenue: 0 };
      productMap[name].qty += item.quantity;
      productMap[name].revenue += item.total_price ?? 0;
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Top customers (by total spend, excluding canceled)
  const customerMap: Record<string, { name: string; count: number; total: number }> = {};
  for (const o of activeOrders) {
    const name = o.customer?.name ?? "Sem cliente";
    if (!customerMap[name]) customerMap[name] = { name, count: 0, total: 0 };
    customerMap[name].count += 1;
    customerMap[name].total += o.total_amount ?? 0;
  }
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const { label: periodLabel } = getPeriodRange(period);

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle={`Visão do negócio — ${periodLabel}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(orders, period)}
            disabled={loading || orders.length === 0}
            className="gap-2"
          >
            <Download className="size-4" />
            Exportar CSV
          </Button>
        }
      />

      {/* Period selector */}
      <div className="mb-6">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
          <TabsList>
            <TabsTrigger value="day">Hoje</TabsTrigger>
            <TabsTrigger value="week">Esta semana</TabsTrigger>
            <TabsTrigger value="month">Este mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Carregando relatório…</span>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Faturamento
                  </span>
                  <DollarSign className="size-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-emerald-600">{BR(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeOrders.length} pedido{activeOrders.length !== 1 ? "s" : ""} efetivados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Ticket médio
                  </span>
                  <TrendingUp className="size-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{BR(avgTicket)}</p>
                <p className="text-xs text-muted-foreground mt-1">Por pedido efetivado</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Total pedidos
                  </span>
                  <Package className="size-4 text-violet-500" />
                </div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Todos os status</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Cancelamentos
                  </span>
                  <XCircle className="size-4 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600">{canceledCount}</p>
                <p className="text-xs text-muted-foreground mt-1">{cancelRate.toFixed(1)}% do total</p>
              </CardContent>
            </Card>
          </div>

          {/* Top products + Top customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Package className="size-4 text-violet-500" />
                  Produtos mais pedidos
                </h3>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Sem dados no período.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-muted-foreground w-4 shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{BR(p.revenue)}</p>
                        </div>
                        <span className="text-sm font-bold shrink-0">{p.qty} un.</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="size-4 text-blue-500" />
                  Clientes com maior gasto
                </h3>
                {topCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Sem dados no período.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topCustomers.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-muted-foreground w-4 shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.count} pedido{c.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 shrink-0">
                          {BR(c.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status breakdown */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Pedidos por status</h3>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sem pedidos no período.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(byStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <div
                        key={status}
                        className="text-center p-4 rounded-lg bg-muted/50 border border-border/50"
                      >
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {STATUS_PT[status] ?? status}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {orders.length > 0
                            ? ((count / orders.length) * 100).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Full orders table */}
          <Card>
            <div className="p-6 border-b border-border">
              <h3 className="font-bold">Todos os pedidos do período</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {orders.length} pedido{orders.length !== 1 ? "s" : ""}
              </p>
            </div>
            {orders.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">
                Nenhum pedido neste período.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                      <th className="px-6 py-3">Pedido</th>
                      <th className="px-6 py-3">Data</th>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Produto(s)</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                          {o.order_number}
                        </td>
                        <td className="px-6 py-3 text-xs">
                          {new Date(o.order_date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-3 font-medium">{o.customer?.name ?? "—"}</td>
                        <td className="px-6 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                          {o.items.map((i) => i.product?.name ?? "—").join(", ") || "—"}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-6 py-3 text-right font-medium">
                          {BR(o.total_amount ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
