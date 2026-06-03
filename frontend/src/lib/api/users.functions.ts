import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getAdminClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase server config.");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const createUserFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      full_name: z.string().min(1),
      username: z.string().optional(),
      role_id: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      full_name: data.full_name,
      username: data.username || null,
      role_id: data.role_id ?? null,
      is_active: true,
    });
    if (profileError) throw new Error(profileError.message);

    return { id: userId };
  });

export const updateUserPasswordFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().uuid(), password: z.string().min(6) }))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const { error } = await admin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
  });

export const deleteUserFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
  });
