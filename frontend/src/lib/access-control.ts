/**
 * Route-level access control.
 *
 * Unlisted routes are accessible to everyone.
 * Listed routes are BLOCKED for the specified roles.
 *
 * Role names must match exactly what's stored in the `roles` table.
 */
const BLOCKED: Record<string, string[]> = {
  "/clientes":      ["Designer", "Produção"],
  "/tabela-precos": ["Designer", "Produção"],
  "/relatorios":    ["Designer", "Produção", "Atendente"],
  "/configuracoes": ["Designer", "Produção", "Atendente"],
  "/usuarios":      ["Designer", "Produção", "Atendente"],
};

/**
 * Returns true if the given role is allowed to visit the given pathname.
 * Administrador (and null/unknown roles while loading) are always allowed.
 */
export function canAccess(roleName: string | null | undefined, pathname: string): boolean {
  if (!roleName || roleName === "Administrador") return true;
  for (const [route, blocked] of Object.entries(BLOCKED)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      if (blocked.includes(roleName)) return false;
    }
  }
  return true;
}

/** Returns the subset of routes the given role cannot access. */
export function blockedRoutes(roleName: string | null | undefined): string[] {
  if (!roleName || roleName === "Administrador") return [];
  return Object.entries(BLOCKED)
    .filter(([, roles]) => roles.includes(roleName))
    .map(([route]) => route);
}
