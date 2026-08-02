import type { MetadataRoute } from "next";
import { fetchSitemapIds } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await fetchSitemapIds();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/docs`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/featured`, changeFrequency: "hourly", priority: 0.8 },
  ];

  const propertyRoutes: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${SITE_URL}/property/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...propertyRoutes];
}
