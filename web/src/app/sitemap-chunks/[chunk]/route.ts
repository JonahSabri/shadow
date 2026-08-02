import { fetchSitemapIds, propertyHref } from "@/lib/api";
import { buildUrlset, xmlResponse, type SitemapUrlEntry } from "@/lib/sitemap-xml";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const CHUNK_SIZE = 200;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chunk: string }> }
) {
  const { chunk } = await params;

  if (chunk === "static") {
    const entries: SitemapUrlEntry[] = [
      { loc: SITE_URL, changefreq: "hourly", priority: "1" },
      { loc: `${SITE_URL}/docs`, changefreq: "weekly", priority: "0.5" },
      { loc: `${SITE_URL}/featured`, changefreq: "hourly", priority: "0.8" },
    ];
    return xmlResponse(buildUrlset(entries));
  }

  const chunkId = parseInt(chunk, 10);
  if (Number.isNaN(chunkId) || chunkId < 0) {
    return new Response("Not found", { status: 404 });
  }

  const properties = await fetchSitemapIds();
  const start = chunkId * CHUNK_SIZE;
  const slice = properties.slice(start, start + CHUNK_SIZE);

  const entries: SitemapUrlEntry[] = slice.map((p) => ({
    loc: `${SITE_URL}${propertyHref(p.id, p.title)}`,
    lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
    changefreq: "daily",
    priority: "0.7",
  }));

  return xmlResponse(buildUrlset(entries));
}
