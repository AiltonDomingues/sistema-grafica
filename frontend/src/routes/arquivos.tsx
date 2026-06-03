import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText, Image as ImageIcon, Download, Filter, Loader2, X } from "lucide-react";
import { getOrderFiles, uploadOrderFile, type FileRow } from "@/lib/api/files";
import { supabase } from "@/lib/supabase";
import type { FileType } from "@/lib/database.types";

export const Route = createFileRoute("/arquivos")({
  head: () => ({ meta: [{ title: "Gestor • Arquivos" }] }),
  component: ArquivosPage,
});

const FILE_TYPE_LABEL: Record<FileType, string> = {
  FINAL_ART: "Arte Final",
  MOCKUP: "Mockup",
  PRINT_FILE: "Impressão",
  REFERENCE_IMAGE: "Referência",
  RECEIPT: "Comprovante",
  OTHER: "Outro",
};

const FILE_TYPE_COLORS: Record<FileType, string> = {
  FINAL_ART: "bg-status-done-bg text-status-done-fg",
  MOCKUP: "bg-status-new-bg text-status-new-fg",
  PRINT_FILE: "bg-status-printing-bg text-status-printing-fg",
  REFERENCE_IMAGE: "bg-status-creation-bg text-status-creation-fg",
  RECEIPT: "bg-status-approval-bg text-status-approval-fg",
  OTHER: "bg-muted text-muted-foreground",
};

function ArquivosPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [fileType, setFileType] = useState<FileType>("FINAL_ART");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setLoading(true);
    getOrderFiles()
      .then(setFiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPendingFile(f);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!pendingFile || !orderNumber.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      // Resolve order_number → order id
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber.trim())
        .single();
      if (orderErr || !order) throw new Error(`Pedido "${orderNumber}" não encontrado.`);

      await uploadOrderFile(order.id, pendingFile, fileType);
      setPendingFile(null);
      setOrderNumber("");
      refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Arquivos"
        subtitle="Gerencie artes, mockups e comprovantes vinculados aos pedidos"
        actions={
          <Button variant="outline" size="sm" className="gap-2"><Filter className="size-4" /> Filtros</Button>
        }
      />

      {/* Upload zone */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        aria-label="Selecionar arquivo para upload"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.psd,.ai,.eps,.zip"
        onChange={handleFileChange}
      />
      {!pendingFile ? (
        <Card
          className="border-2 border-dashed border-border bg-card p-10 mb-6 text-center hover:border-accent/50 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="size-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-bold mb-1">Arraste arquivos aqui ou clique para enviar</h3>
          <p className="text-xs text-muted-foreground">PDF, PNG, JPG, AI, PSD até 50 MB</p>
          <Button size="sm" className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
            Selecionar arquivos
          </Button>
        </Card>
      ) : (
        <Card className="border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-muted-foreground" />
              <p className="font-semibold text-sm">{pendingFile.name}</p>
              <span className="text-xs text-muted-foreground">({(pendingFile.size / 1024 / 1024).toFixed(1)} MB)</span>
            </div>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => { setPendingFile(null); setUploadError(null); }}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label htmlFor="upload-order">Número do pedido</Label>
              <Input
                id="upload-order"
                placeholder="ex: PED-001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-type">Tipo de arquivo</Label>
              <Select value={fileType} onValueChange={(v) => setFileType(v as FileType)}>
                <SelectTrigger id="upload-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FILE_TYPE_LABEL) as FileType[]).map((k) => (
                    <SelectItem key={k} value={k}>{FILE_TYPE_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {uploadError && <p className="text-xs text-destructive mb-3">{uploadError}</p>}
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            disabled={!orderNumber.trim() || uploading}
            onClick={handleUpload}
          >
            {uploading ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : <><UploadCloud className="size-4" /> Enviar arquivo</>}
          </Button>
        </Card>
      )}

      <Card className="border-border overflow-hidden p-0">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-bold">Arquivos recentes</h2>
          <span className="text-xs text-muted-foreground">{files.length} arquivos</span>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <p className="px-6 py-10 text-sm text-muted-foreground text-center">Carregando arquivos...</p>
          ) : files.length === 0 ? (
            <p className="px-6 py-10 text-sm text-muted-foreground text-center">Nenhum arquivo encontrado.</p>
          ) : (
            files.map((f) => {
              const isImage = /\.(png|jpg|jpeg)$/i.test(f.file_name);
              const uploadedDate = new Date(f.uploaded_at).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              });
              return (
                <div key={f.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="size-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {isImage ? <ImageIcon className="size-5 text-muted-foreground" /> : <FileText className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{f.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Pedido {f.order?.order_number ?? "—"} • {f.order?.customer?.name ?? "—"} • {f.uploader?.full_name ?? "—"} • {uploadedDate}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${FILE_TYPE_COLORS[f.file_type]}`}>
                    {FILE_TYPE_LABEL[f.file_type]}
                  </span>
                  {f.signed_url ? (
                    <Button variant="ghost" size="icon" className="size-8" asChild>
                      <a href={f.signed_url} target="_blank" rel="noreferrer" download={f.file_name} title={`Baixar ${f.file_name}`}>
                        <Download className="size-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" className="size-8" disabled title="URL indisponível">
                      <Download className="size-4" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </>
  );
}
