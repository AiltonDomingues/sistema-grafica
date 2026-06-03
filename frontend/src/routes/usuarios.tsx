import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Loader2, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { getUsers, getRoles, updateUser, createUser, deleteUser, getPermissions, getRolePermissions, setRolePermission, updateUserPasswordAdmin, type UserRow, type Permission } from "@/lib/api/users";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Gestor • Usuários" }] }),
  component: UsuariosPage,
});

const PERFIL_COLORS: Record<string, string> = {
  Administrador: "bg-status-cancel-bg text-status-cancel-fg",
  Atendente: "bg-status-new-bg text-status-new-fg",
  Designer: "bg-status-creation-bg text-status-creation-fg",
  Produção: "bg-status-print-bg text-status-print-fg",
};

const MODULE_LABELS: Record<string, string> = {
  pedidos: "Pedidos",
  clientes: "Clientes",
  produtos: "Produtos",
  catalogo: "Catálogo",
  arquivos: "Arquivos",
  financeiro: "Financeiro",
};

function NewUserDialog({
  open,
  onOpenChange,
  roles,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roles: Array<{ id: number; name: string }>;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const reset = () => { setFullName(""); setUsername(""); setEmail(""); setPassword(""); setRoleId(null); setShowPassword(false); };

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error("Nome é obrigatório."); return; }
    if (!email.trim()) { toast.error("E-mail é obrigatório."); return; }
    if (password.length < 6) { toast.error("Senha deve ter ao menos 6 caracteres."); return; }
    setSaving(true);
    try {
      await createUser({
        full_name: fullName,
        username: username || undefined,
        email,
        password,
        role_id: roleId ?? undefined,
      });
      toast.success("Usuário criado com sucesso.");
      onSaved();
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar usuário.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nome completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>E-mail *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: joao@printflow.com" />
          </div>
          <div className="grid gap-1.5">
            <Label>Senha *</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mín. 6 caracteres"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Usuário (login)</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: joao.silva" />
          </div>
          <div className="grid gap-1.5">
            <Label>Perfil</Label>
            <Select
              value={roleId ? String(roleId) : "none"}
              onValueChange={(v) => setRoleId(v === "none" ? null : parseInt(v))}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar perfil..." /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Criar usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null;
  roles: Array<{ id: number; name: string }>;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [roleId, setRoleId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name);
      setUsername(user.username ?? "");
      setRoleId(user.role?.id ?? null);
      setIsActive(user.is_active);
      setNewPassword("");
      setShowPassword(false);
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!user || !fullName.trim()) { toast.error("Nome é obrigatório."); return; }
    if (newPassword && newPassword.length < 6) { toast.error("Senha deve ter ao menos 6 caracteres."); return; }
    setSaving(true);
    try {
      await updateUser(user.id, {
        full_name: fullName,
        username: username || null,
        role_id: roleId ?? undefined,
        is_active: isActive,
      });
      if (newPassword) await updateUserPasswordAdmin(user.id, newPassword);
      toast.success("Usuário atualizado.");
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nome completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Usuário (login)</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: richard.andrade" />
          </div>
          <div className="grid gap-1.5">
            <Label>Perfil</Label>
            <Select
              value={roleId ? String(roleId) : "none"}
              onValueChange={(v) => setRoleId(v === "none" ? null : parseInt(v))}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar perfil..." /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="u-active"
              title="Usuário ativo"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 accent-[hsl(var(--accent))]"
            />
            <Label htmlFor="u-active" className="cursor-pointer">Usuário ativo</Label>
          </div>
          <div className="grid gap-1.5 pt-1">
            <Label>Nova senha <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
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
function PermissionsCard({ roles }: { roles: Array<{ id: number; name: string }> }) {
  const nonAdminRoles = roles.filter((r) => r.name !== "Administrador");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [grantedIds, setGrantedIds] = useState<Set<number>>(new Set());
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    if (nonAdminRoles.length > 0 && selectedRoleId === null) {
      setSelectedRoleId(nonAdminRoles[0].id);
    }
  }, [roles]);

  useEffect(() => {
    getPermissions().then(setPermissions).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedRoleId === null) return;
    setLoadingPerms(true);
    getRolePermissions(selectedRoleId)
      .then((ids) => setGrantedIds(new Set(ids)))
      .catch(console.error)
      .finally(() => setLoadingPerms(false));
  }, [selectedRoleId]);

  const handleToggle = async (permId: number, checked: boolean) => {
    if (selectedRoleId === null || toggling !== null) return;
    setToggling(permId);
    setGrantedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permId); else next.delete(permId);
      return next;
    });
    try {
      await setRolePermission(selectedRoleId, permId, checked);
    } catch (e: any) {
      setGrantedIds((prev) => {
        const next = new Set(prev);
        if (checked) next.delete(permId); else next.add(permId);
        return next;
      });
      toast.error(e.message ?? "Erro ao salvar permissão.");
    } finally {
      setToggling(null);
    }
  };

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const mod = p.code.split(".")[0];
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  return (
    <Card className="border-border p-6">
      <h3 className="font-bold mb-3">Permissões por perfil</h3>
      {nonAdminRoles.length > 0 && (
        <Select
          value={selectedRoleId ? String(selectedRoleId) : ""}
          onValueChange={(v) => setSelectedRoleId(parseInt(v))}
        >
          <SelectTrigger className="mb-4 h-8 text-xs">
            <SelectValue placeholder="Selecionar perfil..." />
          </SelectTrigger>
          <SelectContent>
            {nonAdminRoles.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {loadingPerms ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : permissions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 leading-relaxed">
          Nenhuma permissão cadastrada.<br />
          Execute <code className="font-mono">permissions-seed.sql</code> no painel Supabase.
        </p>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([mod, perms]) => (
            <div key={mod}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                {MODULE_LABELS[mod] ?? mod}
              </p>
              <div className="space-y-1.5">
                {perms.map((perm) => {
                  const checked = grantedIds.has(perm.id);
                  return (
                    <label
                      key={perm.id}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className={checked ? "" : "text-muted-foreground"}>{perm.name}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={toggling === perm.id || selectedRoleId === null}
                        onChange={(e) => handleToggle(perm.id, e.target.checked)}
                        className="size-4 accent-[hsl(var(--accent))] cursor-pointer disabled:cursor-wait"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [deletingSaving, setDeletingSaving] = useState(false);

  const load = () =>
    Promise.all([
      getUsers().then(setUsers),
      getRoles().then(setRoles),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openEdit = (u: UserRow) => { setEditing(u); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingSaving(true);
    try {
      await deleteUser(deleting.id);
      toast.success(`Usuário "${deleting.full_name}" excluído.`);
      setDeleting(null);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao excluir usuário.");
    } finally {
      setDeletingSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Usuários e permissões"
        subtitle={`${users.filter((u) => u.is_active).length} usuários ativos`}
        actions={
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" onClick={() => setNewDialogOpen(true)}>
            <Plus className="size-4" /> Novo usuário
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border overflow-hidden p-0">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold">Equipe</h2>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <p className="px-6 py-10 text-sm text-muted-foreground text-center">Carregando usuários...</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="size-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-accent font-bold text-sm">
                    {u.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.username ?? "—"}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    PERFIL_COLORS[u.role?.name ?? ""] ?? "bg-muted text-muted-foreground"
                  }`}>
                    {u.role?.name ?? "Sem perfil"}
                  </span>
                  <span className={`size-2 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(u)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleting(u)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <PermissionsCard roles={roles} />
      </div>

      <NewUserDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        roles={roles}
        onSaved={load}
      />
      <EditUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
        roles={roles}
        onSaved={load}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleting?.full_name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSaving}>Cancelar</AlertDialogCancel>
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

