import { supabase } from "@/lib/supabase";

export type ProductSizeRow = {
  size: { id: number; name: string; sort_order: number } | null;
};

export type ProductRow = {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  internal_code: string | null;
  base_cost: number | null;
  supplier_name: string | null;
  is_active: boolean;
  color: { id: number; name: string; hex_color: string | null } | null;
  sizes: ProductSizeRow[];
  images: Array<{ id: number; file_url: string; is_primary: boolean }>;
};

export async function getProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, name, category, description, internal_code, base_cost, supplier_name, is_active,
      color:catalog_colors(id, name, hex_color),
      sizes:product_sizes(size:catalog_sizes(id, name, sort_order)),
      images:product_images(id, file_url, is_primary)
    `,
    )
    .order("name");

  if (error) throw error;
  const rows = (data ?? []) as unknown as ProductRow[];
  // Transform raw storage paths to public URLs so product cards can render images.
  return rows.map((p) => ({
    ...p,
    images: p.images.map((img) => ({
      ...img,
      file_url: supabase.storage.from("product-images").getPublicUrl(img.file_url).data.publicUrl,
    })),
  }));
}

export type ProductInput = {
  name: string;
  category?: string | null;
  internal_code?: string | null;
  base_cost?: number | null;
  supplier_name?: string | null;
  description?: string | null;
  color_id?: number | null;
  is_active?: boolean;
};

export async function createProduct(input: ProductInput, sizeIds: number[]): Promise<void> {
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select("id")
    .single();
  if (error) throw error;
  if (sizeIds.length > 0) {
    const { error: sizeError } = await supabase
      .from("product_sizes")
      .insert(sizeIds.map((size_id) => ({ product_id: data.id, size_id })));
    if (sizeError) throw sizeError;
  }
}

const PRODUCT_BUCKET = "product-images";

export async function uploadProductImage(
  productId: number,
  file: File,
  isPrimary: boolean,
): Promise<void> {
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `products/${productId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  if (isPrimary) {
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  }

  const { error: dbError } = await supabase.from("product_images").insert({
    product_id: productId,
    file_url: storagePath,
    is_primary: isPrimary,
  });
  if (dbError) {
    await supabase.storage.from(PRODUCT_BUCKET).remove([storagePath]);
    throw dbError;
  }
}

export async function setProductImagePrimary(imageId: number, productId: number): Promise<void> {
  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);
  if (error) throw error;
}

export async function deleteProductImage(imageId: number, storagePath: string): Promise<void> {
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;
  await supabase.storage.from(PRODUCT_BUCKET).remove([storagePath]);
}

export async function deleteProduct(id: number): Promise<void> {
  // Fetch all image storage paths before deleting so we can clean up storage.
  const { data: images } = await supabase
    .from("product_images")
    .select("file_url")
    .eq("product_id", id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;

  // Remove storage objects (best-effort — DB row already gone).
  if (images && images.length > 0) {
    await supabase.storage
      .from(PRODUCT_BUCKET)
      .remove(images.map((img) => img.file_url));
  }
}

export async function getProductImageUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function getProductImagesWithUrls(
  productId: number,
): Promise<Array<{ id: number; file_url: string; is_primary: boolean; signed_url: string }>> {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, file_url, is_primary")
    .eq("product_id", productId)
    .order("id");
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const { data: signed } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .createSignedUrls(rows.map((r) => r.file_url), 3600);
  return rows.map((r, i) => ({
    ...r,
    signed_url: signed?.[i]?.signedUrl ?? "",
  }));
}

export async function updateProduct(
  id: number,
  input: Partial<ProductInput>,
  sizeIds?: number[],
): Promise<void> {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw error;
  if (sizeIds !== undefined) {
    await supabase.from("product_sizes").delete().eq("product_id", id);
    if (sizeIds.length > 0) {
      const { error: sizeError } = await supabase
        .from("product_sizes")
        .insert(sizeIds.map((size_id) => ({ product_id: id, size_id })));
      if (sizeError) throw sizeError;
    }
  }
}
