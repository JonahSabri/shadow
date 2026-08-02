import type { PropertyListItem, PropertyDetail, PropertyListResponse } from "@/types/property";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export async function fetchProperties(
  params: Record<string, string | number | boolean | undefined>,
  opts?: RequestInit
): Promise<PropertyListResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) qs.set(k, String(v));
  }
  const url = `${API_URL}/properties?${qs}`;
  const res = await fetch(url, { ...opts, next: { revalidate: 60 } });
  if (!res.ok) return { items: [], pagination: { page: 1, limit: 18, total: 0, pages: 0 } };
  return res.json();
}

export async function fetchPropertyDetail(id: number): Promise<PropertyDetail | null> {
  const res = await fetch(`${API_URL}/properties/${id}`, { next: { revalidate: 120 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchFeatured(limit = 12): Promise<PropertyListItem[]> {
  const res = await fetch(`${API_URL}/properties/featured?limit=${limit}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data: PropertyListResponse = await res.json();
  return data.items ?? [];
}

export interface SitemapEntry {
  id: number;
  title: string;
  updated_at: string | null;
}

// لیست سبک همه‌ی ملک‌ها برای ساخت sitemap.xml (بدون دانلود کل جزئیات هرکدام)
export async function fetchSitemapIds(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(`${API_URL}/properties/sitemap-ids`, {
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

// اسلاگ توصیفی از عنوان ملک — طبق راهنمای سئوی گوگل، URLهایی که فقط شامل
// شناسه‌ی عددی هستند برای کاربر و موتور جست‌وجو کم‌فایده‌اند.
export function slugify(text: string, maxLen = 60): string {
  const slug = text
    .trim()
    .replace(/[|:.,،؛«»"'()[\]{}/\\]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, maxLen).replace(/-+$/g, "");
}

// آدرس صفحه‌ی جزئیات یک ملک با اسلاگ توصیفی، مثل /property/۹۹-ویلا-مدرن-نوشهر
export function propertyHref(id: number, title: string): string {
  const slug = slugify(title);
  return slug ? `/property/${id}-${slug}` : `/property/${id}`;
}
