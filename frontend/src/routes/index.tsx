import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, TrendingUp, Activity, ArrowUpRight, Loader2 } from "lucide-react";
import { getOrders, getOrderStatusCounts, type OrderRow } from "@/lib/api/orders";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestor • Dashboard" },
      { name: "description", content: "Visão geral da operação de personalização de camisas." },
    ],
  }),
  component: Dashboard,
});

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

const STATUS_LABEL: Record<string, string> = {
  NEW: "Novo pedido criado",
  IN_CREATION: "Arte em criação",
  WAITING_APPROVAL: "Aguardando aprovação",
  READY_FOR_PRINT: "Pronto para impressão",
  PRINTING: "Em impressão",
  FINISHED: "Pedido finalizado",
  DELIVERED: "Pedido entregue",
  CANCELED: "Pedido cancelado",
};

const STATUS_DOT: Record<string, string> = {
  NEW: "bg-status-new-fg",
  IN_CREATION: "bg-status-creation-fg",
  WAITING_APPROVAL: "bg-yellow-400",
  READY_FOR_PRINT: "bg-status-print-fg",
  PRINTING: "bg-status-printing-fg",
  FINISHED: "bg-status-done-fg",
  DELIVERED: "bg-emerald-500",
  CANCELED: "bg-status-cancel-fg",
};

function Dashboard() {
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  useEffect(() => {
    Promise.all([getOrders(), getOrderStatusCounts()])
      .then(([orders, counts]) => {
        setAllOrders(orders);
        setStatusCounts(counts);
        setLoadedAt(new Date());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = allOrders.filter((o) => o.order_date?.startsWith(today)).length;
  const inCreationCount = (statusCounts["IN_CREATION"] ?? 0) + (statusCounts["WAITING_APPROVAL"] ?? 0);
  const readyForPrintCount = statusCounts["READY_FOR_PRINT"] ?? 0;
  const finishedCount = (statusCounts["FINISHED"] ?? 0) + (statusCounts["DELIVERED"] ?? 0);
  const canceledCount = statusCounts["CANCELED"] ?? 0;
  const newCount = statusCounts["NEW"] ?? 0;

  const kpis = [
    { label: "Pedidos hoje", value: todayCount, note: "Criados hoje", trend: today.slice(5).replace("-", "/"), trendColor: "text-accent bg-status-new-bg" },
    { label: "Em criação", value: inCreationCount, note: "Aguardando arte final", trend: "Designer", trendColor: "text-accent bg-status-new-bg" },
    { label: "Pronto p/ impressão", value: readyForPrintCount, note: "Na fila de produção", trend: "Ativo", trendColor: "text-status-print-fg bg-status-print-bg" },
    { label: "Finalizados", value: finishedCount, note: "Total de concluídos", trend: "✓", trendColor: "text-emerald-600 bg-emerald-50" },
    { label: "Cancelados", value: canceledCount, note: "Total cancelado", trend: "✗", trendColor: "text-status-cancel-fg bg-status-cancel-bg" },
  ];

  const totalActive = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const pct = (n: number) => (totalActive === 0 ? 0 : Math.round((n / totalActive) * 100));

  const productionBars = [
    { label: "Em criação", count: (statusCounts["NEW"] ?? 0) + inCreationCount, color: "bg-status-creation-fg" },
    { label: "Pronto p/ impressão", count: readyForPrintCount, color: "bg-status-print-fg" },
    { label: "Em impressão", count: statusCounts["PRINTING"] ?? 0, color: "bg-status-printing-fg" },
    { label: "Finalizado / Entregue", count: finishedCount, color: "bg-status-done-fg" },
  ];

  const recentOrders = allOrders.slice(0, 5);
  const activityFeed = allOrders.slice(0, 4);

  const updatedLabel = loadedAt
    ? `Atualizado às ${loadedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : "Carregando…";

  const subtitle = loading
    ? "Carregando dados…"
    : newCount > 0
      ? `${newCount} pedido${newCount > 1 ? "s" : ""} novo${newCount > 1 ? "s" : ""} aguardando triagem.`
      : "Nenhum pedido novo aguardando triagem.";

  return (
    <>
      <PageHeader title="Visão geral da operação" subtitle={subtitle} />

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Carregando dashboard…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {kpis.map((k) => (
              <Card key={k.label} className="border-border">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{k.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${k.trendColor}`}>{k.trend}</span>
                  </div>
                  <p className="text-3xl font-bold">{k.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{k.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 border-border overflow-hidden p-0 gap-0">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Pedidos recentes</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{updatedLabel}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/pedidos" className="text-accent gap-1">
                    Ver todos <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              </div>
              <div className="overflow-x-auto">
                {recentOrders.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum pedido cadastrado ainda.
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                        <th className="px-6 py-3">Pedido</th>
                        <th className="px-6 py-3">Cliente</th>
                        <th className="px-6 py-3">Time / Produto</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{o.order_number}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-[10px] font-bold text-accent">
                                {o.customer?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "?"}
                              </div>
                              <span className="font-medium">{o.customer?.name ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium">{o.items[0]?.product?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {o.items[0]?.customization_name
                                ? `${o.items[0].customization_name} / ${o.items[0].customization_number ?? ""}`
                                : "Sem personalização"}
                            </p>
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                          <td className="px-6 py-4 text-right font-medium">
                            R$ {(o.total_amount ?? 0).toFixed(2).replace(".", ",")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <TrendingUp className="size-4 text-accent" /> Produção geral
                    </h3>
                    <span className="text-[10px] text-muted-foreground">{totalActive} pedidos</span>
                  </div>
                  {totalActive === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem pedidos ativos.</p>
                  ) : (
                    <div className="space-y-3">
                      {productionBars.map((s) => {
                        const p = pct(s.count);
                        return (
                          <div key={s.label}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground">{s.label}</span>
                              <span className="font-semibold">{s.count} ({p}%)</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${s.color}`}
                                style={{ width: `${p}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Activity className="size-4 text-accent" /> Atividade recente
                  </h3>
                  {activityFeed.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem atividade recente.</p>
                  ) : (
                    <div className="space-y-4">
                      {activityFeed.map((o) => (
                        <div key={o.id} className="flex gap-3">
                          <div className={`size-2 rounded-full ${STATUS_DOT[o.status] ?? "bg-muted-foreground"} mt-1.5 shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {STATUS_LABEL[o.status] ?? o.status} — {o.order_number}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {o.customer?.name ?? "—"}
                              {o.items[0]?.product?.name ? ` • ${o.items[0].product.name}` : ""}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {relativeTime(o.order_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Atalho rápido</p>
                  <h3 className="font-bold mb-3">Upload de arquivos</h3>
                  <p className="text-xs opacity-80 mb-4">
                    Envie artes finais, mockups e comprovantes diretamente para o pedido.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full gap-2" asChild>
                    <Link to="/arquivos"><FileUp className="size-4" /> Abrir arquivos</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}