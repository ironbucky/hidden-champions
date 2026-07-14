import { DataGateway, GeoLocation } from "./interfaces";
import { createServerSupabaseClient } from "./supabase/server";

export class SupabaseDataAdapter implements DataGateway {
  // Users
  async findUserById(id: string): Promise<unknown | null> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  }

  async updateUser(
    id: string,
    updates: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client.from("users").update(updates).eq("id", id);
    return { error: error ? new Error(error.message) : null };
  }

  // Categories
  async listApprovedCategories(): Promise<unknown[]> {
    const client = await createServerSupabaseClient();
    const { data } = await client
      .from("categories")
      .select("*")
      .eq("status", "approved")
      .order("name");
    return data ?? [];
  }

  // Suppliers
  async findSupplierById(id: string): Promise<unknown | null> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("suppliers")
      .select("*, supplier_photos(*), listings(*)")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  }

  async insertSupplier(
    payload: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("suppliers")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data)
      return {
        id: "",
        error: error ? new Error(error.message) : new Error("Insert failed"),
      };
    return { id: data.id as string, error: null };
  }

  async updateSupplier(
    id: string,
    payload: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client
      .from("suppliers")
      .update(payload)
      .eq("id", id);
    return { error: error ? new Error(error.message) : null };
  }

  // Contacts
  async insertSupplierContact(
    payload: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client.from("supplier_contacts").insert(payload);
    return { error: error ? new Error(error.message) : null };
  }

  async findContactsBySupplier(supplierId: string): Promise<unknown[]> {
    const client = await createServerSupabaseClient();
    const { data } = await client
      .from("supplier_contacts")
      .select("*")
      .eq("supplier_id", supplierId);
    return data ?? [];
  }

  // Photos
  async insertPhoto(
    payload: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("supplier_photos")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data)
      return {
        id: "",
        error: error ? new Error(error.message) : new Error("Insert failed"),
      };
    return { id: data.id as string, error: null };
  }

  async updatePhoto(
    id: string,
    payload: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client
      .from("supplier_photos")
      .update(payload)
      .eq("id", id);
    return { error: error ? new Error(error.message) : null };
  }

  // Listings
  async insertListing(
    payload: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("listings")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data)
      return {
        id: "",
        error: error ? new Error(error.message) : new Error("Insert failed"),
      };
    return { id: data.id as string, error: null };
  }

  // Requests
  async insertRequest(
    payload: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("requests")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data)
      return {
        id: "",
        error: error ? new Error(error.message) : new Error("Insert failed"),
      };
    return { id: data.id as string, error: null };
  }

  async updateRequest(
    id: string,
    payload: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client
      .from("requests")
      .update(payload)
      .eq("id", id);
    return { error: error ? new Error(error.message) : null };
  }

  // Answers
  async insertAnswer(
    payload: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("answers")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data)
      return {
        id: "",
        error: error ? new Error(error.message) : new Error("Insert failed"),
      };
    return { id: data.id as string, error: null };
  }

  async updateAnswer(
    id: string,
    payload: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client.from("answers").update(payload).eq("id", id);
    return { error: error ? new Error(error.message) : null };
  }

  // Upvotes
  async upsertRequestUpvote(
    requestId: string,
    userId: string
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client
      .from("request_upvotes")
      .upsert(
        { request_id: requestId, user_id: userId },
        { onConflict: "request_id, user_id" }
      );
    return { error: error ? new Error(error.message) : null };
  }

  async deleteRequestUpvote(
    requestId: string,
    userId: string
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client
      .from("request_upvotes")
      .delete()
      .eq("request_id", requestId)
      .eq("user_id", userId);
    return { error: error ? new Error(error.message) : null };
  }

  // Reputation
  async upsertChampionReputation(
    payload: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client.from("champion_reputation").upsert(payload, {
      onConflict: "user_id, category_id",
    });
    return { error: error ? new Error(error.message) : null };
  }

  async insertReputationEvent(
    payload: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client.from("reputation_events").insert(payload);
    return { error: error ? new Error(error.message) : null };
  }

  // Admin queue
  async insertAdminQueueItem(
    payload: Record<string, unknown>
  ): Promise<{ id: string; error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { data: result, error } = await client
      .from("admin_queue")
      .insert(payload)
      .select("id")
      .single();
    if (error || !result)
      return {
        id: "",
        error: error ? new Error(error.message) : new Error("Insert failed"),
      };
    return { id: result.id as string, error: null };
  }

  async updateAdminQueueItem(
    id: string,
    payload: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client
      .from("admin_queue")
      .update(payload)
      .eq("id", id);
    return { error: error ? new Error(error.message) : null };
  }

  // Contact unlocks
  async insertContactUnlock(
    userId: string,
    supplierId: string
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client
      .from("contact_unlocks")
      .insert({ user_id: userId, supplier_id: supplierId });
    return { error: error ? new Error(error.message) : null };
  }

  async countContactUnlocksToday(userId: string): Promise<number> {
    const client = await createServerSupabaseClient();
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const { count, error } = await client
      .from("contact_unlocks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("unlocked_at", startOfDay.toISOString());

    if (error || count === null) return 0;
    return count;
  }

  // Finder fee
  async insertFinderFeeLedger(
    payload: Record<string, unknown>
  ): Promise<{ error: Error | null }> {
    const client = await createServerSupabaseClient();
    const { error } = await client.from("finder_fee_ledger").insert(payload);
    return { error: error ? new Error(error.message) : null };
  }

  // Search
  async searchSuppliers(params: {
    query?: string;
    categoryId?: string;
    area?: string;
    near?: GeoLocation;
    limit?: number;
  }): Promise<unknown[]> {
    const client = await createServerSupabaseClient();
    let builder = client
      .from("suppliers")
      .select("*")
      .gt("tier", 1)
      .is("deleted_at", null)
      .order("tier", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(params.limit ?? 50);

    if (params.categoryId) {
      builder = builder.eq("category_id", params.categoryId);
    }

    if (params.area) {
      builder = builder.ilike("area", `%${params.area}%`);
    }

    if (params.query) {
      builder = builder.or(
        `name.ilike.%${params.query}%,area.ilike.%${params.query}%`
      );
    }

    if (params.near) {
      // PostGIS distance ordering should be done via a Postgres RPC function
      // (e.g., `nearby_suppliers(lat, lng, limit)`). This adapter returns the
      // filtered result set; callers can re-order or call the RPC separately.
    }

    const { data } = await builder;
    return data ?? [];
  }
}

export const supabaseDataAdapter = new SupabaseDataAdapter();
