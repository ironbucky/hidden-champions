import { PhotoStorage } from "./interfaces";
import { createServerSupabaseClient } from "./supabase/server";

export class SupabaseStorageAdapter implements PhotoStorage {
  async upload(
    file: File | Blob,
    path: string
  ): Promise<{ path: string; error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client.storage
      .from("supplier-photos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error || !data?.path) {
      return { path: "", error: error ?? new Error("Upload failed") };
    }

    return { path: data.path, error: null };
  }

  getPublicUrl(_path: string): string {
    // Public URL generation is synchronous but requires a client instance.
    // We use the server client; this is safe for server components only.
    void _path;
    throw new Error(
      "Public URLs for held/private photos are not supported. Use getPrivateUrl or serve via RLS."
    );
  }

  async getPrivateUrl(
    path: string,
    expiresIn: number
  ): Promise<{ signedUrl: string; error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client.storage
      .from("supplier-photos")
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      return { signedUrl: "", error: error ?? new Error("Signed URL failed") };
    }

    return { signedUrl: data.signedUrl, error: null };
  }
}

export const supabaseStorageAdapter = new SupabaseStorageAdapter();
