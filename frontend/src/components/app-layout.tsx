import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Shirt,
  FolderOpen,
  BookOpen,
  UserCog,
  Settings,
  Search,
  Bell,
  LogOut,
  Tag,
  UserPen,
  ShieldOff,
  BarChart2,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  updateCurrentUserProfile,
  updateCurrentUserPassword,
  updateCurrentUserEmail,
} from "@/lib/api/users";
import { canAccess } from "@/lib/access-control";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Profile sheet ─────────────────────────────────────────────────────────

function ProfileSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(profile?.full_name ?? "");
      setUsername(profile?.username ?? "");
      setEmail(user?.email ?? "");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open, profile, user]);

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error("Nome é obrigatório."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Informe um e-mail válido."); return;
    }
    if (newPassword && newPassword.length < 6) { toast.error("Senha deve ter ao menos 6 caracteres."); return; }
    if (newPassword && newPassword !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    setSaving(true);
    try {
      await updateCurrentUserProfile({ full_name: fullName.trim(), username: username.trim() || null });
      if (email.trim() !== (user?.email ?? "")) {
        await updateCurrentUserEmail(email.trim());
        toast.success("Perfil atualizado. Um e-mail de confirmação foi enviado para o novo endereço.");
      } else {
        toast.success("Perfil atualizado.");
      }
      if (newPassword) await updateCurrentUserPassword(newPassword);
      await refreshProfile();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-80">
        <SheetHeader className="mb-6">
          <SheetTitle>Meu perfil</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Usuário (login)</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: joao.silva" />
          </div>
          <div className="grid gap-1.5">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            {email.trim() !== (user?.email ?? "") && (
              <p className="text-xs text-muted-foreground">Um link de confirmação será enviado ao novo e-mail.</p>
            )}
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Alterar senha — deixe em branco para manter a atual</p>
            <div className="grid gap-1.5">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="mín. 6 caracteres"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-1.5 mt-3">
              <Label>Confirmar nova senha</Label>
              <Input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetir senha"
              />
            </div>
          </div>
          <div className="pt-2">
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar alterações
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────

const NAV: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/produtos", label: "Produtos", icon: Shirt },
  { to: "/catalogo", label: "Catálogo", icon: BookOpen },
  { to: "/tabela-precos", label: "Tabela de Preços", icon: Tag },
  { to: "/arquivos", label: "Arquivos", icon: FolderOpen },
  { to: "/relatorios", label: "Relatórios", icon: BarChart2 },
  { to: "/usuarios", label: "Usuários", icon: UserCog },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const roleName = profile?.role?.name ?? null;
  const displayName = profile?.full_name ?? "…";
  const roleLabel = roleName ?? "…";
  const initials = profile ? getInitials(profile.full_name) : "…";

  const visibleNav = NAV.filter((item) => canAccess(roleName, item.to));
  const allowed = canAccess(roleName, pathname);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 bg-sidebar-bg/80 backdrop-blur-xl text-sidebar-fg flex flex-col fixed h-screen z-20 border-r border-border/60">
        <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
          <div className="size-7 bg-accent rounded-[8px] flex items-center justify-center text-accent-foreground">
            <Printer className="size-4" />
          </div>
          <span className="text-foreground font-semibold tracking-tight text-[15px]">PrintFlow</span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 mt-2 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13.5px] font-medium transition-all",
                  active
                    ? "bg-sidebar-active text-foreground"
                    : "text-sidebar-fg hover:bg-sidebar-active/60 hover:text-foreground",
                )}
              >
                <Icon className={cn("size-[15px]", active ? "text-accent" : "opacity-70")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 mt-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="size-7 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              {initials}
            </div>
            <div className="text-[12px] leading-tight flex-1 min-w-0">
              <p className="text-foreground font-semibold truncate">{displayName}</p>
              <p className="text-muted-foreground truncate">{roleLabel}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setProfileOpen(true)}
              title="Editar perfil"
            >
              <UserPen className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={signOut}
              title="Sair"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-60 min-w-0">
        <header className="h-14 glass border-b border-border/60 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2.5 w-1/3 max-w-md">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar pedidos, clientes ou arquivos"
              className="bg-transparent border-none outline-none text-[13.5px] w-full text-foreground placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchTerm.trim()) {
                  navigate({ to: "/pedidos", search: { q: searchTerm.trim() } });
                  setSearchTerm("");
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Servidor online
            </div>
            <Button variant="ghost" size="icon" className="relative size-8 rounded-full">
              <Bell className="size-[15px]" />
              <span className="absolute top-1.5 right-1.5 size-1.5 bg-accent rounded-full" />
            </Button>
          </div>
        </header>

        <div className="px-10 py-10 max-w-[1400px] mx-auto">
          {allowed ? (
            <Outlet />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <ShieldOff className="size-7 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Acesso restrito</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Você não tem permissão para acessar esta página.
              </p>
            </div>
          )}
        </div>
      </main>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
