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
import { Loader2, Plus, Pencil, Trash2, Save, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  getPriceTables,
  createPriceTable,
  updatePriceTable,
  deletePriceTable,
  getPriceTableItems,
  upsertPriceTableItem,
  deletePriceTableItem,
  type PriceTable,
} from "@/lib/api/settings";

export const Route = createFileRoute("/tabela-precos")({
  head: () => ({ meta: [{ title: "Gestor • Tabela de Preços" }] }),
  component: TabelaPrecosPage,
});

// ── New / rename table dialog ─────────────────────────────────────────────

function TableNameDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: PriceTable | null;
  onSaved: (t: PriceTable) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDesc(initial?.description ?? "");
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    try {
      if (initial) {
        await updatePriceTable(initial.id, name, desc || null);
        onSaved({ ...initial, name: name.trim(), description: desc || null });
        toast.success("Tabela atualizada.");
      } else {
        const created = await createPriceTable(name, desc || undefined);
        onSaved(created);
        toast.success("Tabela criada.");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "Renomear tabela" : "Nova tabela de preços"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Tabela C, Atacado..."
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Descrição (opcional)</Label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex.: Clientes com volume alto"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Per-table items editor ────────────────────────────────────────────────

type DraftItem = { id: number | null; service_name: string; unit_price: string; saving: boolean };

function PriceTableEditor({ table }: { table: PriceTable }) {
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getPriceTableItems(table.id)
      .then((data) =>
        setItems(
          data.map((i) => ({
            id: i.id,
            service_name: i.service_name,
            unit_price: String(i.unit_price),
            saving: false,
          })),
        ),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [table.id]);

  const addRow = () =>
    setItems((prev) => [...prev, { id: null, service_name: "", unit_price: "", saving: false }]);

  const updateRow = (idx: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const saveRow = async (idx: number) => {
    const row = items[idx];
    if (!row.service_name.trim()) { toast.error("Nome do serviço é obrigatório."); return; }
    const price = parseFloat(row.unit_price);
    if (isNaN(price) || price < 0) { toast.error("Preço inválido."); return; }
    updateRow(idx, { saving: true });
    try {
      await upsertPriceTableItem(table.id, row.service_name, price);
      toast.success("Salvo.");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar.");
      updateRow(idx, { saving: false });
    }
  };

  const removeRow = async (idx: number) => {
    const row = items[idx];
    if (row.id === null) { setItems((prev) => prev.filter((_, i) => i !== idx)); return; }
    updateRow(idx, { saving: true });
    try {
      await deletePriceTableItem(row.id);
      toast.success("Serviço removido.");
      setItems((prev) => prev.filter((_, i) => i !== idx));
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao remover.");
      updateRow(idx, { saving: false });
    }
  };

  if (loading)
    return <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>;

  return (
    <div>
      <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold pb-2 border-b border-border">
        <div className="col-span-6">Serviço / nome</div>
        <div className="col-span-3 text-right">Preço unit. (R$)</div>
        <div className="col-span-3"></div>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Nenhum serviço cadastrado ainda.
        </p>
      )}
      {items.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-border last:border-0"
        >
          <div className="col-span-6">
            <Input
              value={row.service_name}
              onChange={(e) => updateRow(idx, { service_name: e.target.value })}
              placeholder="Ex.: Nome (personalização)"
              className="h-8 text-sm"
            />
          </div>
          <div className="col-span-3">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={row.unit_price}
              onChange={(e) => updateRow(idx, { unit_price: e.target.value })}
              placeholder="0,00"
              className="h-8 text-sm text-right"
            />
          </div>
          <div className="col-span-3 flex gap-1 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs"
              onClick={() => saveRow(idx)}
              disabled={row.saving}
            >
              {row.saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
              Salvar
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => removeRow(idx)}
              disabled={row.saving}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <div className="pt-3">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={addRow}>
          <Plus className="size-3" /> Adicionar serviço
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

function TabelaPrecosPage() {
  const [tables, setTables] = useState<PriceTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<PriceTable | null>(null);
  const [deletingTable, setDeletingTable] = useState<PriceTable | null>(null);
  const [deletingSaving, setDeletingSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getPriceTables()
      .then((data) => {
        setTables(data);
        setSelectedId((prev) => {
          if (prev && data.some((t) => t.id === prev)) return prev;
          return data[0]?.id ?? null;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditingTable(null); setTableDialogOpen(true); };
  const openEdit = (t: PriceTable, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTable(t);
    setTableDialogOpen(true);
  };

  const handleTableSaved = (t: PriceTable) => { load(); setSelectedId(t.id); };

  const handleDelete = async () => {
    if (!deletingTable) return;
    setDeletingSaving(true);
    try {
      await deletePriceTable(deletingTable.id);
      toast.success("Tabela excluída.");
      setDeletingTable(null);
      setSelectedId(null);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao excluir.");
    } finally {
      setDeletingSaving(false);
    }
  };

  const selectedTable = tables.find((t) => t.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="Tabela de Preços"
        subtitle="Crie tabelas nomeadas e atribua a cada cliente. Os preços são aplicados automaticamente nos pedidos."
        actions={
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
            onClick={openNew}
          >
            <Plus className="size-4" /> Nova tabela
          </Button>
        }
      />

      <Card className="border-border overflow-hidden p-0">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="flex divide-x divide-border min-h-[420px]">
            {/* Left: table list */}
            <div className="w-56 shrink-0">
              {tables.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground">Nenhuma tabela cadastrada.</p>
              ) : (
                tables.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-border text-sm transition-colors ${
                      t.id === selectedId
                        ? "bg-accent/10 text-accent font-semibold"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <div className="flex gap-0.5 shrink-0 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={(e) => openEdit(t, e)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeletingTable(t); }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: items editor */}
            <div className="flex-1 p-6">
              {selectedTable ? (
                <>
                  <div className="mb-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Tag className="size-4 text-accent" />
                      {selectedTable.name}
                    </h3>
                    {selectedTable.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedTable.description}</p>
                    )}
                  </div>
                  <PriceTableEditor table={selectedTable} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecione uma tabela para editar seus serviços.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      <TableNameDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        initial={editingTable}
        onSaved={handleTableSaved}
      />

      <AlertDialog open={!!deletingTable} onOpenChange={(v) => !v && setDeletingTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tabela?</AlertDialogTitle>
            <AlertDialogDescription>
              A tabela &quot;{deletingTable?.name}&quot; e todos os seus serviços serão removidos permanentemente.
              Clientes associados perderão a referência a esta tabela.
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
