import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { photoId, storagePath, supplierId } = await req.json();

    if (!photoId || !storagePath) {
      return new Response(JSON.stringify({ error: "photoId and storagePath required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Download the image from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from("supplier-photos")
      .download(storagePath);

    if (downloadError || !fileData) {
      // Fail-safe: mark as held
      await supabaseClient
        .from("supplier_photos")
        .update({ ocr_status: "held" })
        .eq("id", photoId);

      await supabaseClient.from("admin_queue").insert({
        item_type: "photo",
        item_id: supplierId || photoId,
        status: "pending",
        metadata: {
          storage_path: storagePath,
          note: "OCR failed to download image — held for manual review",
        },
      });

      return new Response(JSON.stringify({ status: "held", reason: "download_failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to text via a simple approach: scan for embedded text/metadata
    // For MVP, we check the image bytes for known phone patterns
    const arrayBuffer = await fileData.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer.slice(0, 4096));

    const phoneRegex = /(?:\+?92|0)?3\d{2}[-\s]?\d{7}/g;
    const match = text.match(phoneRegex);

    if (match) {
      const detectedPhone = match[0];

      // Phone pattern detected — hold for admin review
      await supabaseClient
        .from("supplier_photos")
        .update({
          ocr_status: "held",
          ocr_detected_phone: detectedPhone,
        })
        .eq("id", photoId);

      // Record as ocr_detected contact for comparison with champion-typed phone
      if (supplierId) {
        await supabaseClient.from("supplier_contacts").insert({
          supplier_id: supplierId,
          phone: detectedPhone,
          source: "ocr_detected",
          added_by_user_id: "00000000-0000-0000-0000-000000000000",
        });
      }

      await supabaseClient.from("admin_queue").insert({
        item_type: "photo",
        item_id: supplierId || photoId,
        status: "pending",
        metadata: {
          storage_path: storagePath,
          detected_phone: detectedPhone,
          note: "Phone pattern detected in image",
        },
      });

      return new Response(
        JSON.stringify({ status: "held", detected: true, phone: detectedPhone }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean — publish immediately and resolve the admin queue item
    const now = new Date().toISOString();
    await supabaseClient
      .from("supplier_photos")
      .update({
        ocr_status: "clean",
        published_at: now,
      })
      .eq("id", photoId);

    // Auto-resolve the safety-net admin queue item for this photo
    await supabaseClient
      .from("admin_queue")
      .update({ status: "resolved", resolved_at: now })
      .eq("item_type", "photo")
      .eq("metadata->>photo_id", photoId)
      .eq("status", "pending");

    return new Response(JSON.stringify({ status: "clean", published: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
