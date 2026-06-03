import { supabase } from "@/lib/supabase";
import { createUserFn, updateUserPasswordFn, deleteUserFn } from "./users.functions";

export type UserRow = {
  id: string; // UUID
  full_name: string;
  username: string | null;
  is_active: boolean;
  created_at: string;
  role: { id: number; name: string } | null;
};

export async function getUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, is_active, created_at, role:roles(id, name)")
    .order("full_name");

  if (error) throw error;
  return (data ?? []) as unknown as UserRow[];
}

export async function getRoles(): Promise<Array<{ id: number; name: string }>> {
  const { data, error } = await supabase.from("roles").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function updateUser(
  id: string,
  input: { full_name?: string; username?: string | null; role_id?: number; is_active?: boolean },
): Promise<void> {
  const { error } = await supabase.from("profiles").update(input).eq("id", id);
  if (error) throw error;
}

export async function createUser(input: {
  email: string;
  password: string;
  full_name: string;
  username?: string;
  role_id?: number;
}): Promise<void> {
  await createUserFn({ data: input });
}

export async function updateCurrentUserProfile(input: {
  full_name?: string;
  username?: string | null;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { error } = await supabase.from("profiles").update(input).eq("id", user.id);
  if (error) throw error;
}

export async function updateCurrentUserPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function updateCurrentUserEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
}

export async function updateUserPasswordAdmin(userId: string, password: string): Promise<void> {
  await updateUserPasswordFn({ data: { userId, password } });
}

export async function deleteUser(userId: string): Promise<void> {
  await deleteUserFn({ data: { userId } });
}

export type Permission = {
  id: number;
  code: string;
  name: string;
};

export async function getPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from("permissions")
    .select("id, code, name")
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export async function getRolePermissions(roleId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.permission_id);
}

export async function setRolePermission(
  roleId: number,
  permissionId: number,
  enabled: boolean,
): Promise<void> {
  if (enabled) {
    const { error } = await supabase
      .from("role_permissions")
      .upsert({ role_id: roleId, permission_id: permissionId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId)
      .eq("permission_id", permissionId);
    if (error) throw error;
  }
}
