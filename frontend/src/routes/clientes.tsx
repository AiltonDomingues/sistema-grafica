import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Mail, Phone, MapPin, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerRow,
  type CustomerInput,
} from "@/lib/api/customers";
import { getPriceTables, type PriceTable } from "@/lib/api/settings";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Gestor • Clientes" }] }),
  component: ClientesPage,
});

const EMPTY_FORM: CustomerInput = {
  name: "",
  email: "",
  phone: "",
  document: "",
  city: "",
  state: "",
  is_active: true,
  price_table_id: null,
};

function CustomerDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: CustomerRow | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CustomerInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [priceTables, setPriceTables] = useState<PriceTable[]>([]);

  useEffect(() => {
    if (open) {
      getPriceTables().then(setPriceTables).catch(console.error);
      setForm(
        initial
          ? {
              name: initial.name,
              email: initial.email ?? "",
              phone: initial.phone ?? "",
              document: initial.document ?? "",
              city: initial.city ?? "",
              state: initial.state ?? "",
              is_active: initial.is_active,
              price_table_id: initial.price_table_id ?? null,
            }
          : EMPTY_FORM,
      );
    }
  }, [open, initial]);

  const set = (k: keyof CustomerInput, v: string | boolean | number | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    try {
      const payload: CustomerInput = {
        ...form,
        email: form.email || null,
        phone: form.phone || null,
        document: form.document || null,
        city: form.city || null,
        state: form.state || null,
      };
      if (initial) {
        await updateCustomer(initial.id, payload);
        toast.success("Cliente atualizado.");
      } else {
        await createCustomer(payload);
        toast.success("Cliente criado.");
      }
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="c-name">Nome *</Label>
            <Input id="c-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="c-email">E-mail</Label>
              <Input id="c-email" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-phone">Telefone</Label>
              <Input id="c-phone" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-doc">CPF / CNPJ</Label>
            <Input id="c-doc" value={form.document ?? ""} onChange={(e) => set("document", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="c-city">Cidade</Label>
              <Input id="c-city" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-state">Estado</Label>
              <Input id="c-state" maxLength={2} value={form.state ?? ""} onChange={(e) => set("state", e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Tabela de preços</Label>
            <Select
              value={form.price_table_id ? String(form.price_table_id) : "none"}
              onValueChange={(v) => set("price_table_id", v === "none" ? null : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem tabela de preços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem tabela de preços</SelectItem>
                {priceTables.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="c-active"
              title="Cliente ativo"
              checked={form.is_active ?? true}
              onChange={(e) => set("is_active", e.target.checked)}
              className="size-4 accent-[hsl(var(--accent))]"
            />
            <Label htmlFor="c-active" className="cursor-pointer">Cliente ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClientesPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [deleting, setDeleting] = useState<CustomerRow | null>(null);
  const [deletingSaving, setDeletingSaving] = useState(false);

  const load = () =>
    getCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filtered = customers.filter((c) =>
    !query ||
    `${c.name} ${c.email ?? ""} ${c.document ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: CustomerRow) => { setEditing(c); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingSaving(true);
    try {
      await deleteCustomer(deleting.id);
      toast.success("Cliente excluído.");
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
        title="Clientes"
        subtitle={`${customers.length} clientes cadastrados`}
        actions={
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" onClick={openNew}>
            <Plus className="size-4" /> Novo cliente
          </Button>
        }
      />

      <Card className="border-border p-4 mb-4">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou documento..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Carregando clientes...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const orderCount = c.orders[0]?.count ?? 0;
            const priceRuleCount = c.customer_price_rules[0]?.count ?? 0;
            const cityState = [c.city, c.state].filter(Boolean).join(" / ");
            return (
              <Card
                key={c.id}
                className="border-border p-5 hover:border-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-accent font-bold text-sm">
                      {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold leading-tight">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.document ?? "—"}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {c.is_active ? "ATIVO" : "INATIVO"}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  <p className="flex items-center gap-2"><Mail className="size-3" /> {c.email ?? "—"}</p>
                  <p className="flex items-center gap-2"><Phone className="size-3" /> {c.phone ?? "—"}</p>
                  <p className="flex items-center gap-2"><MapPin className="size-3" /> {cityState || "—"}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pedidos</p>
                    <p className="text-lg font-bold">{orderCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tabela de preços</p>
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-1 rounded bg-status-new-bg text-status-new-fg">
                      <Tag className="size-2.5" />
                      {c.price_table?.name ?? "—"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(c)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={load}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" será excluído permanentemente. Pedidos existentes não serão afetados.
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

