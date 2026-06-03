import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getCatalogTeams,
  getCatalogColors,
  getCatalogSizes,
  getCatalogShippingMethods,
  createCatalogTeam,
  deleteCatalogTeam,
  createCatalogColor,
  deleteCatalogColor,
  createCatalogSize,
  deleteCatalogSize,
  createCatalogShippingMethod,
  deleteCatalogShippingMethod,
} from "@/lib/api/catalog";
import type { DbCatalogTeam, DbCatalogColor, DbCatalogSize, DbCatalogShippingMethod } from "@/lib/database.types";

export const Route = createFileRoute("/catalogo")({
  head: () => ({ meta: [{ title: "Gestor • Catálogo" }] }),
  component: CatalogoPage,
});

type Section = {
  key: string;
  label: string;
  desc: string;
  items: Array<{ id: number; name: string }>;
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

function CatalogSection({ section }: { section: Section }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const handleAdd = async () => {
    const name = value.trim();
    if (!name) return;
    setSaving(true);
    try {
      await section.onAdd(name);
      setValue("");
      setAdding(false);
      toast.success(`"${name}" adicionado.`);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao adicionar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await section.onDelete(id);
      toast.success(`"${name}" removido.`);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao remover.");
    }
  };

  return (
    <Card className="border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold">{section.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{section.desc}</p>
        </div>
        {!adding && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Adicionar
          </Button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2 mb-4">
          <Input
            ref={inputRef}
            placeholder={`Nome do ${section.label.toLowerCase().replace("s", "").trim()}...`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") { setAdding(false); setValue(""); }
            }}
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Salvar"}
          </Button>
          <Button variant="ghost" size="sm" className="h-8" onClick={() => { setAdding(false); setValue(""); }}>
            Cancelar
          </Button>
        </div>
      )}

      {section.items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum item cadastrado.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {section.items.map((item) => (
            <span
              key={item.id}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-xs font-medium hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              {item.name}
              <button
                onClick={() => handleDelete(item.id, item.name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                aria-label={`Remover ${item.name}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function CatalogoPage() {
  const [times, setTimes] = useState<DbCatalogTeam[]>([]);
  const [cores, setCores] = useState<DbCatalogColor[]>([]);
  const [tamanhos, setTamanhos] = useState<DbCatalogSize[]>([]);
  const [envios, setEnvios] = useState<DbCatalogShippingMethod[]>([]);

  const reload = () => {
    getCatalogTeams().then(setTimes).catch(console.error);
    getCatalogColors().then(setCores).catch(console.error);
    getCatalogSizes().then(setTamanhos).catch(console.error);
    getCatalogShippingMethods().then(setEnvios).catch(console.error);
  };

  useEffect(reload, []);

  const wrap = (fn: () => Promise<void>) => async () => { await fn(); reload(); };

  const sections: Section[] = [
    {
      key: "times",
      label: "Times",
      desc: "Times disponíveis para personalização",
      items: times,
      onAdd: (name) => wrap(() => createCatalogTeam(name))(),
      onDelete: (id) => wrap(() => deleteCatalogTeam(id))(),
    },
    {
      key: "cores",
      label: "Cores",
      desc: "Cores base de camisas",
      items: cores,
      onAdd: (name) => wrap(() => createCatalogColor(name))(),
      onDelete: (id) => wrap(() => deleteCatalogColor(id))(),
    },
    {
      key: "tamanhos",
      label: "Tamanhos",
      desc: "Grade de tamanhos",
      items: tamanhos,
      onAdd: (name) => wrap(() => createCatalogSize(name))(),
      onDelete: (id) => wrap(() => deleteCatalogSize(id))(),
    },
    {
      key: "envios",
      label: "Formas de envio",
      desc: "Modalidades de entrega",
      items: envios,
      onAdd: (name) => wrap(() => createCatalogShippingMethod(name))(),
      onDelete: (id) => wrap(() => deleteCatalogShippingMethod(id))(),
    },
  ];

  return (
    <>
      <PageHeader title="Catálogo" subtitle="Padronize listas reutilizadas em todo o sistema" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((s) => (
          <CatalogSection key={s.key} section={s} />
        ))}
      </div>
    </>
  );
}
