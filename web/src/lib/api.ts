import type { PropertyListItem, PropertyDetail, PropertyListResponse } from "@/types/property";

// آدرس عمومیِ API که در مرورگر استفاده می‌شود (برای src عکس‌ها) — باید از بیرون قابل دسترسی باشد.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

// آدرس داخلیِ API برای fetch سمت سرور (SSR). اگر ست نشده باشد از همان آدرس عمومی استفاده می‌شود،
// ولی روی سرور اصلی بهتر است روی localhost/شبکه‌ی داخلی داکر تنظیم شود تا درخواست از طریق
// اینترنت/nginx دور نزند.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? API_URL;

export async function fetchProperties(
  params: Record<string, string | number | boolean | undefined>,
  opts?: RequestInit
): Promise<PropertyListResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) qs.set(k, String(v));
  }
  const url = `${API_INTERNAL_URL}/properties?${qs}`;
  const res = await fetch(url, { ...opts, next: { revalidate: 60 } });
  if (!res.ok) return { items: [], pagination: { page: 1, limit: 18, total: 0, pages: 0 } };
  return res.json();
}

export async function fetchPropertyDetail(id: number): Promise<PropertyDetail | null> {
  const res = await fetch(`${API_INTERNAL_URL}/properties/${id}`, { next: { revalidate: 120 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchFeatured(limit = 12): Promise<PropertyListItem[]> {
  const res = await fetch(`${API_INTERNAL_URL}/properties/featured?limit=${limit}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data: PropertyListResponse = await res.json();
  return data.items ?? [];
}

export interface SitemapEntry {
  id: number;
  updated_at: string | null;
}

// لیست سبک همه‌ی ملک‌ها برای ساخت sitemap.xml (بدون دانلود کل جزئیات هرکدام)
export async function fetchSitemapIds(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(`${API_INTERNAL_URL}/properties/sitemap-ids`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

// فرمت قیمت
export function formatPrice(price: number | null, currency = "تومان"): string {
  if (!price || price <= 0) return "توافقی";
  if (price >= 1_000_000_000) {
    const b = (price / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
    return `${b} میلیارد ${currency}`;
  }
  if (price >= 1_000_000) {
    const m = (price / 1_000_000).toFixed(0);
    return `${parseInt(m).toLocaleString("fa-IR")} میلیون ${currency}`;
  }
  return `${price.toLocaleString("fa-IR")} ${currency}`;
}

export function dealLabel(deal: string): string {
  return deal === "sale" ? "فروش" : deal === "rent" ? "اجاره" : deal;
}

// تصاویر از بکند به‌صورت مسیر نسبی (/media/...) برمی‌گردند تا پروکسی شوند؛
// اینجا آدرس کامل بکند را جلوی آن‌ها اضافه می‌کنیم.
export function imageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
}
