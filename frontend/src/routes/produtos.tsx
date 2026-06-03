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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Shirt, Pencil, Loader2, UploadCloud, Trash2, Star, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { useRef } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  setProductImagePrimary,
  deleteProductImage,
  getProductImagesWithUrls,
  type ProductRow,
  type ProductInput,
} from "@/lib/api/products";
import { getCatalogColors, getCatalogSizes } from "@/lib/api/catalog";
import type { DbCatalogColor, DbCatalogSize } from "@/lib/database.types";

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [{ title: "Gestor • Produtos" }] }),
  component: ProdutosPage,
});

const EMPTY_FORM: ProductInput = {
  name: "",
  category: "",
  internal_code: "",
  base_cost: null,
  supplier_name: "",
  description: "",
  color_id: null,
  is_active: true,
};

function ProductDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ProductRow | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [colors, setColors] = useState<DbCatalogColor[]>([]);
  const [sizes, setSizes] = useState<DbCatalogSize[]>([]);
  const [saving, setSaving] = useState(false);

  // Image management
  type ImgRow = { id: number; file_url: string; is_primary: boolean; signed_url: string };
  const [images, setImages] = useState<ImgRow[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savedProductId, setSavedProductId] = useState<number | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const reloadImages = async (productId: number) => {
    const imgs = await getProductImagesWithUrls(productId);
    setImages(imgs);
  };

  useEffect(() => {
    getCatalogColors().then(setColors).catch(console.error);
    getCatalogSizes().then(setSizes).catch(console.error);
  }, []);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name,
          category: initial.category ?? "",
          internal_code: initial.internal_code ?? "",
          base_cost: initial.base_cost,
          supplier_name: initial.supplier_name ?? "",
          description: initial.description ?? "",
          color_id: initial.color?.id ?? null,
          is_active: initial.is_active,
        });
        setSelectedSizes(initial.sizes.map((s) => s.size?.id).filter((id): id is number => id != null));
        setSavedProductId(initial.id);
        reloadImages(initial.id).catch(console.error);
      } else {
        setForm(EMPTY_FORM);
        setSelectedSizes([]);
        setSavedProductId(null);
        setImages([]);
      }
    }
  }, [open, initial]);

  const set = (k: keyof ProductInput, v: string | number | boolean | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleSize = (id: number) =>
    setSelectedSizes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    try {
      const payload: ProductInput = {
        ...form,
        category: form.category || null,
        internal_code: form.internal_code || null,
        supplier_name: form.supplier_name || null,
        description: form.description || null,
      };
      if (initial) {
        await updateProduct(initial.id, payload, selectedSizes);
        setSavedProductId(initial.id);
        toast.success("Produto atualizado.");
      } else {
        // createProduct doesn't return id — re-fetch by name to get id for image upload
        await createProduct(payload, selectedSizes);
        toast.success("Produto criado. Agora você pode adicionar imagens.");
        // reload products to get the new product id for image management
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase
          .from("products")
          .select("id")
          .eq("name", payload.name)
          .order("id", { ascending: false })
          .limit(1)
          .single();
        if (data?.id) {
          setSavedProductId(data.id);
          reloadImages(data.id).catch(console.error);
        }
        onSaved();
        return; // keep dialog open so user can add images
      }
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !savedProductId) return;
    setUploadingImg(true);
    try {
      const isPrimary = images.length === 0;
      await uploadProductImage(savedProductId, file, isPrimary);
      await reloadImages(savedProductId);
      toast.success("Imagem adicionada.");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao enviar imagem.");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSetPrimary = async (img: ImgRow) => {
    if (!savedProductId || img.is_primary) return;
    try {
      await setProductImagePrimary(img.id, savedProductId);
      await reloadImages(savedProductId);
      onSaved();
    } catch (err: any) {
      toast.error(err.message ?? "Erro.");
    }
  };

  const handleDeleteImage = async (img: ImgRow) => {
    try {
      await deleteProductImage(img.id, img.file_url);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      onSaved();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao remover imagem.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="p-name">Nome *</Label>
            <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p-cat">Categoria</Label>
              <Input id="p-cat" value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-code">Código interno</Label>
              <Input id="p-code" value={form.internal_code ?? ""} onChange={(e) => set("internal_code", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p-cost">Custo base (R$)</Label>
              <Input
                id="p-cost"
                type="number"
                min="0"
                step="0.01"
                value={form.base_cost ?? ""}
                onChange={(e) => set("base_cost", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-supplier">Fornecedor</Label>
              <Input id="p-supplier" value={form.supplier_name ?? ""} onChange={(e) => set("supplier_name", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Cor base</Label>
            <Select
              value={form.color_id ? String(form.color_id) : "none"}
              onValueChange={(v) => set("color_id", v === "none" ? null : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar cor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {colors.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Tamanhos disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSize(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    selectedSizes.includes(s.id)
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-muted text-muted-foreground border-transparent hover:border-accent/40"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-desc">Descrição</Label>
            <textarea
              id="p-desc"
              title="Descrição do produto"
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="p-active"
              title="Produto ativo"
              checked={form.is_active ?? true}
              onChange={(e) => set("is_active", e.target.checked)}
              className="size-4 accent-[hsl(var(--accent))]"
            />
            <Label htmlFor="p-active" className="cursor-pointer">Produto ativo</Label>
          </div>

          {/* ── Image management (only available after product is saved) ── */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>
                Fotos do produto
                {!savedProductId && (
                  <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                    (salve o produto primeiro)
                  </span>
                )}
              </Label>
              {savedProductId && (
                <>
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    title="Adicionar foto do produto"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    disabled={uploadingImg}
                    onClick={() => imgInputRef.current?.click()}
                  >
                    {uploadingImg ? <Loader2 className="size-3 animate-spin" /> : <UploadCloud className="size-3" />}
                    Adicionar foto
                  </Button>
                </>
              )}
            </div>
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted">
                    <img
                      src={img.signed_url}
                      alt=""
                      className="object-cover w-full h-full"
                    />
                    {img.is_primary && (
                      <span className="absolute top-1.5 left-1.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="size-2.5" fill="currentColor" strokeWidth={0} /> Principal
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.is_primary && (
                        <button
                          type="button"
                          title="Definir como principal"
                          className="p-1.5 rounded-full bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
                          onClick={() => handleSetPrimary(img)}
                        >
                          <Star className="size-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Remover imagem"
                        className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                        onClick={() => handleDeleteImage(img)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : savedProductId ? (
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 transition-colors"
                onClick={() => imgInputRef.current?.click()}
              >
                <UploadCloud className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Clique para adicionar a primeira foto</p>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {savedProductId && !initial ? "Fechar" : "Cancelar"}
          </Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : initial ? "Salvar" : "Criar produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProdutosPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);
  const [deletingSaving, setDeletingSaving] = useState(false);

  const load = () =>
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filtered = products.filter(
    (p) =>
      !query ||
      `${p.name} ${p.internal_code ?? ""} ${p.category ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: ProductRow) => { setEditing(p); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingSaving(true);
    try {
      await deleteProduct(deleting.id);
      toast.success("Produto excluído.");
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
        title="Produtos"
        subtitle={`${products.length} produtos no catálogo`}
        actions={
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" onClick={openNew}>
            <Plus className="size-4" /> Novo produto
          </Button>
        }
      />

      <Card className="border-border p-4 mb-4">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, código ou categoria..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Carregando produtos...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const primaryImage = p.images.find((img) => img.is_primary) ?? p.images[0];
            const sizes = p.sizes
              .map((s) => s.size?.name)
              .filter(Boolean)
              .sort();
            return (
              <Card
                key={p.id}
                className="border-border overflow-hidden p-0 group hover:border-accent/40 transition-colors"
              >
                <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={primaryImage.file_url}
                      alt={p.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Shirt className="size-16 text-muted-foreground/30" strokeWidth={1} />
                  )}
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full ${
                    p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {p.is_active ? "ATIVO" : "INATIVO"}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{p.category ?? "—"}</p>
                  <h3 className="font-bold mb-2">{p.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-muted-foreground">{p.internal_code ?? "—"}</span>
                    <span className="text-xs font-medium">
                      R$ {(p.base_cost ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sizes.map((t) => (
                      <span key={t} className="text-[10px] font-bold px-1.5 py-0.5 bg-muted rounded">{t}</span>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Pencil className="size-3.5 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(p)}
                        >
                          <Trash2 className="size-3.5 mr-2" /> Excluir produto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={load}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto <strong>{deleting?.name}</strong> será excluído permanentemente, incluindo todas as imagens.
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

