import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getSettings,
  saveSettings,
  type AppSettings,
} from "@/lib/api/settings";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Gestor • Configurações" }] }),
  component: ConfiguracoesPage,
});

// ── Empresa + Numeração card ──────────────────────────────────────────────

function EmpresaCard({
  settings,
  onSaved,
}: {
  settings: AppSettings;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    company_name: "",
    company_cnpj: "",
    company_phone: "",
    company_email: "",
    order_prefix: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      company_name: settings.company_name ?? "",
      company_cnpj: settings.company_cnpj ?? "",
      company_phone: settings.company_phone ?? "",
      company_email: settings.company_email ?? "",
      order_prefix: settings.order_prefix ?? "PD",
    });
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(form);
      toast.success("Configurações salvas.");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border p-6 lg:col-span-2">
      <h3 className="font-bold mb-1">Dados da empresa</h3>
      <p className="text-xs text-muted-foreground mb-4">Informações da gráfica</p>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Nome fantasia</Label>
            <Input
              className="mt-1"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">CNPJ</Label>
            <Input
              className="mt-1"
              value={form.company_cnpj}
              onChange={(e) => setForm((f) => ({ ...f, company_cnpj: e.target.value }))}
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Telefone</Label>
            <Input
              className="mt-1"
              value={form.company_phone}
              onChange={(e) => setForm((f) => ({ ...f, company_phone: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">E-mail</Label>
            <Input
              className="mt-1"
              type="email"
              value={form.company_email}
              onChange={(e) => setForm((f) => ({ ...f, company_email: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Prefixo de pedidos</Label>
            <Input
              className="mt-1 font-mono"
              value={form.order_prefix}
              onChange={(e) => setForm((f) => ({ ...f, order_prefix: e.target.value }))}
              placeholder="PD"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Salvar
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Notifications card ────────────────────────────────────────────────────

const NOTIF_KEYS = [
  { key: "notif_new_order", label: "Novo pedido recebido" },
  { key: "notif_art_approved", label: "Arte aprovada" },
  { key: "notif_ready_to_ship", label: "Pedido pronto para envio" },
  { key: "notif_late_client", label: "Cliente inadimplente" },
];

function NotifCard({
  settings,
  onSaved,
}: {
  settings: AppSettings;
  onSaved: () => void;
}) {
  const [vals, setVals] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const { key } of NOTIF_KEYS) initial[key] = settings[key] === "true";
    setVals(initial);
  }, [settings]);

  const toggle = (key: string) => setVals((v) => ({ ...v, [key]: !v[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: AppSettings = {};
      for (const k of Object.keys(vals)) payload[k] = vals[k] ? "true" : "false";
      await saveSettings(payload);
      toast.success("Notificações salvas.");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border p-6">
      <h3 className="font-bold mb-1">Notificações</h3>
      <p className="text-xs text-muted-foreground mb-4">Alertas operacionais</p>
      <div className="space-y-3 text-sm">
        {NOTIF_KEYS.map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span>{label}</span>
            <button
              type="button"
              onClick={() => toggle(key)}
              className={`w-9 h-5 rounded-full relative transition-colors ${
                vals[key] ? "bg-accent" : "bg-muted"
              }`}
            >
              <div
                className={`size-4 bg-white rounded-full absolute top-0.5 shadow transition-all ${
                  vals[key] ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </label>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <Button size="sm" variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Salvar
        </Button>
      </div>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

function ConfiguracoesPage() {
  const [settings, setSettings] = useState<AppSettings>({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  const loadSettings = () => {
    setLoadingSettings(true);
    getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoadingSettings(false));
  };

  useEffect(() => { loadSettings(); }, []);

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Dados da empresa e preferências do sistema"
      />

      {loadingSettings ? (
        <p className="text-sm text-muted-foreground py-6">Carregando configurações...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EmpresaCard settings={settings} onSaved={loadSettings} />
          <NotifCard settings={settings} onSaved={loadSettings} />
        </div>
      )}
    </>
  );
}

