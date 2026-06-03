import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Filter, Download, Plus, MoreHorizontal, Trash2, Loader2, X, Paperclip, UploadCloud, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { STATUS_LABEL, type OrderStatus } from "@/lib/mock-data";
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  type OrderRow,
  type OrderItemInput,
} from "@/lib/api/orders";
import { getCustomers, type CustomerRow } from "@/lib/api/customers";
import {
  getCatalogTeams,
  getCatalogColors,
  getCatalogSizes,
  getCatalogShippingMethods,
} from "@/lib/api/catalog";
import { getProducts, type ProductRow } from "@/lib/api/products";
import { getFilesForOrder, uploadOrderFile, deleteOrderFile, type FileRow } from "@/lib/api/files";
import { useRef } from "react";
import { getPriceTableItems, type PriceTableItem } from "@/lib/api/settings";
import type { DbCatalogTeam, DbCatalogColor, DbCatalogSize, DbCatalogShippingMethod } from "@/lib/database.types";

export const Route = createFileRoute("/pedidos")({
  head: () => ({ meta: [{ title: "Gestor • Pedidos" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) ?? undefined,
  }),
  component: PedidosPage,
});

const STATUS_FILTERS: Array<{ value: OrderStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "NEW", label: "Novos" },
  { value: "IN_CREATION", label: "Em criação" },
  { value: "WAITING_APPROVAL", label: "Aprovação" },
  { value: "READY_FOR_PRINT", label: "Pronto" },
  { value: "PRINTING", label: "Impressão" },
  { value: "FINISHED", label: "Finalizados" },
  { value: "DELIVERED", label: "Entregues" },
  { value: "CANCELED", label: "Cancelados" },
];

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["IN_CREATION", "CANCELED"],
  IN_CREATION: ["WAITING_APPROVAL", "CANCELED"],
  WAITING_APPROVAL: ["IN_CREATION", "READY_FOR_PRINT", "CANCELED"],
  READY_FOR_PRINT: ["PRINTING", "CANCELED"],
  PRINTING: ["FINISHED", "CANCELED"],
  FINISHED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
};

type OrderItemDraft = OrderItemInput & { _key: number };

const EMPTY_ITEM = (): OrderItemDraft => ({
  _key: Date.now() + Math.random(),
  product_id: null,
  team_id: null,
  color_id: null,
  size_id: null,
  quantity: 1,
  unit_price: null,
  customization_name: null,
  customization_number: null,
});

function OrderItemRow({
  item,
  products,
  teams,
  colors,
  sizes,
  priceTableItems,
  onChange,
  onRemove,
}: {
  item: OrderItemDraft;
  products: ProductRow[];
  teams: DbCatalogTeam[];
  colors: DbCatalogColor[];
  sizes: DbCatalogSize[];
  priceTableItems: PriceTableItem[];
  onChange: (patch: Partial<OrderItemInput>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start py-3 border-b border-border last:border-0">
      <div className="col-span-2">
        <Select
          value={item.product_id ? String(item.product_id) : "none"}
          onValueChange={(v) => onChange({ product_id: v === "none" ? null : parseInt(v) })}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Produto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2">
        <Select
          value={item.team_id ? String(item.team_id) : "none"}
          onValueChange={(v) => onChange({ team_id: v === "none" ? null : parseInt(v) })}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Time" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {teams.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-1">
        <Select
          value={item.color_id ? String(item.color_id) : "none"}
          onValueChange={(v) => onChange({ color_id: v === "none" ? null : parseInt(v) })}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Cor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {colors.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-1">
        <Select
          value={item.size_id ? String(item.size_id) : "none"}
          onValueChange={(v) => onChange({ size_id: v === "none" ? null : parseInt(v) })}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tam." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {sizes.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onChange({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
          className="h-8 text-xs text-center"
        />
      </div>
      <div className="col-span-2">
        {priceTableItems.length > 0 && (
          <Select
            value="none"
            onValueChange={(v) => {
              if (v === "none") return;
              const pi = priceTableItems.find((p) => String(p.id) === v);
              if (pi) onChange({ unit_price: pi.unit_price });
            }}
          >
            <SelectTrigger className="h-6 text-[10px] mb-0.5 text-muted-foreground">
              <SelectValue placeholder="↓ da tabela" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— selecionar serviço —</SelectItem>
              {priceTableItems.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.service_name} — R$ {Number(p.unit_price).toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.unit_price ?? ""}
          onChange={(e) => onChange({ unit_price: parseFloat(e.target.value) || null })}
          className="h-8 text-xs"
          placeholder="R$ 0,00"
        />
      </div>
      <div className="col-span-2">
        <div className="flex gap-1">
          <Input
            placeholder="Nome"
            value={item.customization_name ?? ""}
            onChange={(e) => onChange({ customization_name: e.target.value || null })}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Nº"
            value={item.customization_number ?? ""}
            onChange={(e) => onChange({ customization_number: e.target.value || null })}
            className="h-8 text-xs w-14"
          />
        </div>
      </div>
      <div className="col-span-1 flex justify-end">
        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={onRemove}>
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

const FILE_TYPE_LABEL: Record<string, string> = {
  FINAL_ART: "Arte final",
  MOCKUP: "Mockup",
  PRINT_FILE: "Arquivo de impressão",
  REFERENCE: "Referência",
  OTHER: "Outro",
};

function OrderFilesSheet({
  order,
  onClose,
}: {
  order: OrderRow | null;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState<string>("FINAL_ART");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = async (orderId: number) => {
    setLoadingFiles(true);
    try {
      setFiles(await getFilesForOrder(orderId));
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar arquivos.");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (order) reload(order.id);
    else setFiles([]);
  }, [order?.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !order) return;
    setUploading(true);
    try {
      await uploadOrderFile(order.id, file, fileType as any);
      await reload(order.id);
      toast.success("Arquivo enviado.");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao enviar.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (f: FileRow) => {
    if (!order) return;
    try {
      await deleteOrderFile(f.id, f.file_url);
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
      toast.success("Arquivo removido.");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao remover.");
    }
  };

  return (
    <Sheet open={!!order} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Paperclip className="size-4" />
            Arquivos — {order?.order_number}
          </SheetTitle>
        </SheetHeader>

        {/* Upload bar */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-2 flex-wrap bg-muted/30">
          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FILE_TYPE_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            title="Selecionar arquivo para envio"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="size-3 animate-spin" /> : <UploadCloud className="size-3" />}
            Enviar arquivo
          </Button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingFiles ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="size-10 text-muted-foreground/30 mb-3" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">Nenhum arquivo anexado ainda.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Enviar arquivo" para adicionar.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 py-3">
                  <FileText className="size-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.file_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {FILE_TYPE_LABEL[f.file_type] ?? f.file_type}
                      {f.uploader ? ` · ${f.uploader.full_name}` : ""}
                      {" · "}{new Date(f.uploaded_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {f.signed_url && (
                      <a
                        href={f.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={f.file_name}
                        title={`Baixar ${f.file_name}`}
                      >
                        <Button variant="ghost" size="icon" className="size-7" title="Baixar">
                          <Download className="size-3.5" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      title="Remover"
                      onClick={() => handleDelete(f)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NewOrderDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItemDraft[]>([EMPTY_ITEM()]);
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [teams, setTeams] = useState<DbCatalogTeam[]>([]);
  const [colors, setColors] = useState<DbCatalogColor[]>([]);
  const [sizes, setSizes] = useState<DbCatalogSize[]>([]);
  const [shippingMethods, setShippingMethods] = useState<DbCatalogShippingMethod[]>([]);
  const [priceTableItems, setPriceTableItems] = useState<PriceTableItem[]>([]);
  const [priceTableName, setPriceTableName] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      getCustomers().then(setCustomers).catch(console.error);
      getProducts().then(setProducts).catch(console.error);
      getCatalogTeams().then(setTeams).catch(console.error);
      getCatalogColors().then(setColors).catch(console.error);
      getCatalogSizes().then(setSizes).catch(console.error);
      getCatalogShippingMethods().then(setShippingMethods).catch(console.error);
      setCustomerId(null);
      setShippingMethodId(null);
      setOrderDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setItems([EMPTY_ITEM()]);
      setPriceTableItems([]);
      setPriceTableName(null);
    }
  }, [open]);

  const handleCustomerChange = (v: string) => {
    const newId = v === "none" ? null : parseInt(v);
    setCustomerId(newId);
    if (newId) {
      const customer = customers.find((c) => c.id === newId);
      const tableId = customer?.price_table_id;
      if (tableId) {
        getPriceTableItems(tableId)
          .then((items) => {
            setPriceTableItems(items);
            setPriceTableName(customer?.price_table?.name ?? null);
          })
          .catch(console.error);
      } else {
        setPriceTableItems([]);
        setPriceTableName(null);
      }
    } else {
      setPriceTableItems([]);
      setPriceTableName(null);
    }
  };

  const updateItem = (key: number, patch: Partial<OrderItemInput>) =>
    setItems((prev) => prev.map((it) => (it._key === key ? { ...it, ...patch } : it)));

  const removeItem = (key: number) =>
    setItems((prev) => prev.filter((it) => it._key !== key));

  const handleSave = async () => {
    if (!customerId) { toast.error("Selecione um cliente."); return; }
    setSaving(true);
    try {
      await createOrder({
        customer_id: customerId,
        shipping_method_id: shippingMethodId,
        order_date: orderDate,
        notes: notes || null,
        items: items.filter((it) => it.product_id || it.team_id),
      });
      toast.success("Pedido criado com sucesso.");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar pedido.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo pedido</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 grid gap-1.5">
              <Label>Cliente *</Label>
              <Select
                value={customerId ? String(customerId) : "none"}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {priceTableName && (
                <p className="text-[10px] text-muted-foreground">
                  Tabela de preços: <span className="font-semibold text-foreground">{priceTableName}</span>
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Data do pedido</Label>
              <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Forma de envio</Label>
            <Select
              value={shippingMethodId ? String(shippingMethodId) : "none"}
              onValueChange={(v) => setShippingMethodId(v === "none" ? null : parseInt(v))}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não definido</SelectItem>
                {shippingMethods.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Itens do pedido</Label>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setItems((p) => [...p, EMPTY_ITEM()])}>
                <Plus className="size-3" /> Adicionar item
              </Button>
            </div>
            <Card className="border-border p-3">
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold pb-2 border-b border-border">
                <div className="col-span-2">Produto</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-1">Cor</div>
                <div className="col-span-1">Tam.</div>
                <div className="col-span-1 text-center">Qtd</div>
                <div className="col-span-2">Preço unit.</div>
                <div className="col-span-2">Personalização</div>
                <div className="col-span-1"></div>
              </div>
              {items.map((item) => (
                <OrderItemRow
                  key={item._key}
                  item={item}
                  products={products}
                  teams={teams}
                  colors={colors}
                  sizes={sizes}
                  priceTableItems={priceTableItems}
                  onChange={(patch) => updateItem(item._key, patch)}
                  onRemove={() => removeItem(item._key)}
                />
              ))}
            </Card>
          </div>

          <div className="grid gap-1.5">
            <Label>Observações</Label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Instruções especiais, referências..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Criar pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PedidosPage() {
  const searchParams = Route.useSearch();
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [deleting, setDeleting] = useState<OrderRow | null>(null);
  const [deletingSaving, setDeletingSaving] = useState(false);
  const [filesOrder, setFilesOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    if (searchParams.q) {
      setQuery(searchParams.q);
    }
  }, [searchParams.q]);

  const load = () =>
    getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    if (filter !== "ALL" && o.status !== filter) return false;
    const firstItem = o.items[0];
    const searchStr =
      `${o.order_number} ${o.customer?.name ?? ""} ${firstItem?.team?.name ?? ""}`.toLowerCase();
    if (query && !searchStr.includes(query.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = async (order: OrderRow, status: OrderStatus) => {
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Status alterado para "${STATUS_LABEL[status]}".`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao alterar status.");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingSaving(true);
    try {
      await deleteOrder(deleting.id);
      toast.success("Pedido excluído.");
      setDeleting(null);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao excluir.");
    } finally {
      setDeletingSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle={`${filtered.length} pedidos encontrados`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2"><Download className="size-4" /> Exportar</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" onClick={() => setNewOrderOpen(true)}>
              <Plus className="size-4" /> Novo pedido
            </Button>
          </>
        }
      />

      <Card className="border-border p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente ou time..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2"><Filter className="size-4" /> Filtros</Button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-4 border-t border-border">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filter === s.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="border-border overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-widest border-b border-border">
                <th className="px-6 py-3">Pedido</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Produto / Time</th>
                <th className="px-6 py-3">Personalização</th>
                <th className="px-6 py-3">Envio</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Carregando pedidos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const item = o.items[0];
                  const [y, m, d] = o.order_date.split("-");
                  const formattedDate = `${d}/${m}/${y}`;
                  const transitions = STATUS_TRANSITIONS[o.status];
                  return (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{o.order_number}</td>
                      <td className="px-6 py-4 font-medium">{o.customer?.name ?? "—"}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{item?.product?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {item?.team?.name ?? "—"} · {item?.color?.name ?? "—"} · {item?.size?.name ?? "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {item?.customization_name ? (
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {item.customization_name} #{item.customization_number ?? "—"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {o.shipping_method?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{formattedDate}</td>
                      <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                      <td className="px-6 py-4 text-right font-medium">
                        R$ {(o.total_amount ?? 0).toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {transitions.length > 0 && (
                              <>
                                <DropdownMenuLabel className="text-xs">Alterar status</DropdownMenuLabel>
                                {transitions.map((s) => (
                                  <DropdownMenuItem key={s} onClick={() => handleStatusChange(o, s)}>
                                    {STATUS_LABEL[s]}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => setFilesOrder(o)}>
                              <Paperclip className="size-3.5 mr-2" /> Arquivos / Arte
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleting(o)}
                            >
                              <Trash2 className="size-3.5 mr-2" /> Excluir pedido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Mostrando {filtered.length} de {orders.length} pedidos</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Próxima</Button>
          </div>
        </div>
      </Card>

      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} onSaved={load} />
      <OrderFilesSheet order={filesOrder} onClose={() => setFilesOrder(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              O pedido {deleting?.order_number} será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deletingSaving}
            >
              {deletingSaving ? <Loader2 className="size-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

