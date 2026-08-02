import { fetchSitemapIds } from "@/lib/api";
import { buildSitemapIndex, xmlResponse } from "@/lib/sitemap-xml";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const CHUNK_SIZE = 200;

// ایندکس sitemap — به‌جای یک فایل حجیم با همه‌ی ملک‌ها، به چند فایل کوچک‌تر
// اشاره می‌کند تا روی اتصال‌های کند/ناپایدار قطع نشود.
export async function GET() {
  const properties = await fetchSitemapIds();
  const chunkCount = Math.max(1, Math.ceil(properties.length / CHUNK_SIZE));

  const locs = [
    `${SITE_URL}/sitemap-chunks/static.xml`,
    ...Array.from({ length: chunkCount }, (_, i) => `${SITE_URL}/sitemap-chunks/${i}.xml`),
  ];

  return xmlResponse(buildSitemapIndex(locs));
}
