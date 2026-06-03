import { supabase } from "@/lib/supabase";
import type { FileType } from "@/lib/database.types";

const BUCKET = "order-files";

export type FileRow = {
  id: number;
  /** Storage path, e.g. orders/42/FINAL_ART_1717420800000.pdf */
  file_url: string;
  file_name: string;
  file_type: FileType;
  mime_type: string | null;
  uploaded_at: string;
  /** Signed URL valid for 1 h — populated by getOrderFiles() */
  signed_url: string | null;
  order: {
    id: number;
    order_number: string;
    customer: { name: string } | null;
  } | null;
  uploader: { id: string; full_name: string } | null;
};

export async function getOrderFiles(): Promise<FileRow[]> {
  const { data, error } = await supabase
    .from("order_files")
    .select(
      `
      id, file_name, file_type, file_url, mime_type, uploaded_at,
      order:orders(id, order_number, customer:customers(name)),
      uploader:profiles!uploaded_by(id, full_name)
    `,
    )
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as unknown as Omit<FileRow, "signed_url">[];
  if (rows.length === 0) return [];

  // Batch-generate signed URLs (1 h expiry) for all storage paths.
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(rows.map((r) => r.file_url), 3600);

  return rows.map((r, i) => ({
    ...r,
    signed_url: signed?.[i]?.signedUrl ?? null,
  }));
}

/** Upload a file to Storage and insert the record in order_files. */
export async function uploadOrderFile(
  orderId: number,
  file: File,
  fileType: FileType,
  notes?: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `orders/${orderId}/${fileType}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) throw uploadError;

  const { error: dbError } = await supabase.from("order_files").insert({
    order_id:    orderId,
    file_type:   fileType,
    file_name:   file.name,
    file_url:    storagePath,
    mime_type:   file.type || null,
    uploaded_by: user.id,
    notes:       notes ?? null,
  });

  if (dbError) {
    // Roll back the storage object so we don't leave orphans.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw dbError;
  }
}

/** Get all files attached to a specific order, with signed URLs. */
export async function getFilesForOrder(orderId: number): Promise<FileRow[]> {
  const { data, error } = await supabase
    .from("order_files")
    .select(
      `
      id, file_name, file_type, file_url, mime_type, uploaded_at,
      order:orders(id, order_number, customer:customers(name)),
      uploader:profiles!uploaded_by(id, full_name)
    `,
    )
    .eq("order_id", orderId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as unknown as Omit<FileRow, "signed_url">[];
  if (rows.length === 0) return [];

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(rows.map((r) => r.file_url), 3600);

  return rows.map((r, i) => ({
    ...r,
    signed_url: signed?.[i]?.signedUrl ?? null,
  }));
}

/** Delete a file record and its storage object. */
export async function deleteOrderFile(fileId: number, storagePath: string): Promise<void> {
  const { error } = await supabase.from("order_files").delete().eq("id", fileId);
  if (error) throw error;
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

/** Get a fresh signed URL for a single storage path (default 1 h). */
export async function getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
