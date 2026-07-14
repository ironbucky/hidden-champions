import { MetadataRoute } from "next";
import { createServiceRoleClient } from "@/infrastructure/supabase/serviceRole";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const service = createServiceRoleClient();

  const { data: suppliers } = await service
    .from("suppliers")
    .select("id, tier_updated_at")
    .gt("tier", 1)
    .is("deleted_at", null)
    .order("tier_updated_at", { ascending: false });

  const supplierUrls: MetadataRoute.Sitemap = (suppliers ?? []).map(
    (s: { id: string; tier_updated_at: string | null }) => ({
      url: `https://hiddenchampions.pk/suppliers/${s.id}`,
      lastModified: s.tier_updated_at
        ? new Date(s.tier_updated_at)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  return [
    {
      url: "https://hiddenchampions.pk",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://hiddenchampions.pk/suppliers",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://hiddenchampions.pk/champions",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...supplierUrls,
  ];
}
