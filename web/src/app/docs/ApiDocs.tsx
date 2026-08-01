"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight, Play, Code2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

interface Param {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description: string;
  example?: string;
}

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  params?: Param[];
  sampleResponse: object;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/properties",
    title: "لیست ملک‌ها",
    description: "لیست پیج‌بندی‌شده ملک‌های فعال. از query parameters برای فیلتر کردن استفاده کنید.",
    params: [
      { name: "page",          type: "int",     default: "1",    description: "شماره صفحه (از ۱)" },
      { name: "limit",         type: "int",     default: "18",   description: "تعداد در هر صفحه (حداکثر ۵۰)" },
      { name: "search",        type: "string",  description: "جستجو در عنوان و توضیحات", example: "ویلا ساحلی" },
      { name: "city",          type: "string",  description: "نام شهر", example: "نوشهر" },
      { name: "neighborhood",  type: "string",  description: "نام محله", example: "سیسنگان" },
      { name: "deal_type",     type: "enum",    description: "نوع معامله: sale | rent" },
      { name: "property_type", type: "enum",    description: "نوع ملک: villa | apartment | land | house | shop | office" },
      { name: "min_price",     type: "int",     description: "حداقل قیمت (تومان)", example: "1000000000" },
      { name: "max_price",     type: "int",     description: "حداکثر قیمت (تومان)", example: "5000000000" },
      { name: "min_area",      type: "int",     description: "حداقل متراژ (م²)" },
      { name: "max_area",      type: "int",     description: "حداکثر متراژ (م²)" },
      { name: "bedrooms",      type: "int",     description: "تعداد اتاق خواب" },
      { name: "sea_view",      type: "bool",    description: "ویو دریا: true | false" },
      { name: "forest_view",   type: "bool",    description: "ویو جنگل: true | false" },
      { name: "bbox",          type: "string",  description: "محدوده نقشه: min_lng,min_lat,max_lng,max_lat", example: "51.4,36.4,51.7,36.7" },
      { name: "ordering",      type: "string",  default: "-created_at", description: "ترتیب: -created_at | -price | price | -area" },
    ],
    sampleResponse: {
      items: [
        {
          id: 123,
          title: "ویلا باغ دوبلکس در نوشهر — ویو دریا",
          city_name: "نوشهر",
          neighborhood_name: "سیسنگان",
          area: 280,
          bedrooms: 3,
          price: 8500000000,
          currency: "تومان",
          deal_type: "sale",
          deal_type_display: "فروش",
          property_type_key: "villa",
          property_type_name: "ویلا",
          is_featured: true,
          is_urgent: false,
          sea_view: true,
          forest_view: false,
          primary_image: { image_url: "https://cdn.example.com/media/..." },
          last_updated: "2025-06-01T12:00:00",
        },
      ],
      pagination: { page: 1, limit: 18, total: 142, pages: 8 },
    },
  },
  {
    method: "GET",
    path: "/properties/featured",
    title: "ملک‌های ویژه و فوری",
    description: "لیست ملک‌هایی که is_featured یا is_urgent هستند.",
    params: [
      { name: "limit", type: "int", default: "12", description: "تعداد نتایج (حداکثر ۵۰)" },
    ],
    sampleResponse: {
      items: ["...مشابه /properties"],
      pagination: { page: 1, limit: 12, total: 18, pages: 2 },
    },
  },
  {
    method: "GET",
    path: "/properties/{id}",
    title: "جزئیات یک ملک",
    description: "اطلاعات کامل یک ملک بر اساس ID.",
    params: [
      { name: "id", type: "int", required: true, description: "شناسه عددی ملک", example: "307" },
    ],
    sampleResponse: {
      id: 307,
      title: "آپارتمان ۱۲۰ متری مرکز نوشهر",
      description: "آپارتمان ۳ خوابه در بهترین موقعیت مرکز شهر...",
      city_name: "نوشهر",
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
      floor: 3,
      total_floors: 5,
      year_built: 1402,
      price: 3200000000,
      currency: "تومان",
      deal_type: "sale",
      has_elevator: true,
      features: ["آسانسور", "پارکینگ", "انباری"],
      images_data: [{ id: 1, image_url: "https://..." }],
    },
  },
  {
    method: "GET",
    path: "/",
    title: "اطلاعات API",
    description: "اطلاعات نسخه و لیست endpoint‌های موجود.",
    sampleResponse: {
      name: "املاک شمال API",
      version: "1.0.0",
      description: "API رایگان ملک‌های نوشهر و شمال ایران",
      endpoints: ["GET /properties", "GET /properties/{id}", "GET /properties/featured"],
    },
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      title="کپی"
      style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)", borderRadius: ".4rem", padding: ".3rem .5rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: ".25rem", color: copied ? "#4ade80" : "var(--muted)", fontSize: ".75rem", transition: "all .2s" }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "کپی شد" : "کپی"}
    </button>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const exampleUrl = `${API_BASE}${ep.path.replace("{id}", "307")}`;

  const tryIt = async () => {
    setLoading(true);
    try {
      const res = await fetch(exampleUrl);
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch {
      setResult("خطا در ارتباط با API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", overflow: "hidden" }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="docs-endpoint-header"
        style={{ width: "100%", display: "flex", alignItems: "center", flexWrap: "wrap", gap: ".6rem 1rem", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "right", color: "inherit", fontFamily: "inherit" }}
      >
        <span style={{ background: ep.method === "GET" ? "rgba(65,196,217,.15)" : "rgba(74,222,128,.15)", color: ep.method === "GET" ? "#41c4d9" : "#4ade80", borderRadius: ".4rem", padding: ".2rem .6rem", fontSize: ".75rem", fontWeight: 900, flexShrink: 0 }}>
          {ep.method}
        </span>
        <code style={{ fontSize: ".875rem", color: "#fff", fontFamily: "monospace", direction: "ltr", flex: "1 1 160px", minWidth: 0, textAlign: "left", overflowWrap: "break-word" }}>
          {ep.path}
        </code>
        <span style={{ fontWeight: 700, fontSize: ".875rem", color: "rgba(255,255,255,.8)" }}>{ep.title}</span>
        <span style={{ marginRight: "auto", color: "var(--muted)" }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          <p style={{ color: "var(--muted)", fontSize: ".875rem", margin: "1rem 0" }}>{ep.description}</p>

          {/* Params table */}
          {ep.params && ep.params.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ fontWeight: 700, fontSize: ".85rem", marginBottom: ".5rem" }}>پارامترها</h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".8rem", direction: "rtl" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["نام", "نوع", "اجباری", "پیش‌فرض", "توضیح"].map(h => (
                        <th key={h} style={{ padding: ".5rem .75rem", textAlign: "right", color: "var(--muted)", fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map(p => (
                      <tr key={p.name} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                        <td style={{ padding: ".5rem .75rem" }}><code style={{ color: "#9ee8f8" }}>{p.name}</code></td>
                        <td style={{ padding: ".5rem .75rem", color: "var(--muted)" }}>{p.type}</td>
                        <td style={{ padding: ".5rem .75rem", color: p.required ? "#ef4444" : "var(--muted)" }}>{p.required ? "بله" : "خیر"}</td>
                        <td style={{ padding: ".5rem .75rem", color: "var(--muted)" }}>{p.default ?? "—"}</td>
                        <td style={{ padding: ".5rem .75rem", color: "rgba(255,255,255,.7)" }}>{p.description}{p.example ? <span style={{ color: "var(--muted)", marginRight: ".35rem" }}>مثال: <code>{p.example}</code></span> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Example URL */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".4rem" }}>
              <h4 style={{ fontWeight: 700, fontSize: ".85rem" }}>مثال</h4>
              <CopyButton text={exampleUrl} />
            </div>
            <code style={{ display: "block", background: "var(--surface-2)", borderRadius: ".6rem", padding: ".75rem 1rem", fontSize: ".8rem", color: "#9ee8f8", direction: "ltr", overflowX: "auto" }}>
              {exampleUrl}
            </code>
          </div>

          {/* Try it */}
          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={tryIt}
              disabled={loading}
              className="btn btn-primary"
              style={{ fontSize: ".82rem", padding: ".45rem 1rem" }}
            >
              <Play size={13} />
              {loading ? "در حال اجرا..." : "اجرا کن"}
            </button>
            {result && (
              <div style={{ marginTop: ".75rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".4rem" }}>
                  <span style={{ fontWeight: 700, fontSize: ".82rem" }}>پاسخ دریافتی</span>
                  <CopyButton text={result} />
                </div>
                <pre style={{ background: "var(--surface-2)", borderRadius: ".6rem", padding: "1rem", fontSize: ".75rem", overflowX: "auto", color: "#9ee8f8", direction: "ltr", maxHeight: 340 }}>
                  {result}
                </pre>
              </div>
            )}
          </div>

          {/* Sample response */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".4rem" }}>
              <h4 style={{ fontWeight: 700, fontSize: ".85rem" }}>نمونه پاسخ</h4>
              <CopyButton text={JSON.stringify(ep.sampleResponse, null, 2)} />
            </div>
            <pre style={{ background: "var(--surface-2)", borderRadius: ".6rem", padding: "1rem", fontSize: ".73rem", overflowX: "auto", color: "#a3e635", direction: "ltr", maxHeight: 260 }}>
              {JSON.stringify(ep.sampleResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiDocs() {
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "2rem 0 2.5rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "1rem", background: "linear-gradient(135deg,#c0392b,#e74c3c)", marginBottom: "1rem" }}>
          <Code2 size={26} color="#fff" />
        </div>
        <h1 style={{ fontWeight: 900, fontSize: "1.75rem", marginBottom: ".75rem" }}>
          املاک شمال <span style={{ color: "#c0392b" }}>API</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: ".95rem", maxWidth: 520, margin: "0 auto" }}>
          API رایگان ملک‌های نوشهر و شمال ایران — بدون ثبت‌نام، با CORS آزاد و کش خودکار.
        </p>
      </div>

      {/* Quick info */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: ".75rem", marginBottom: "2rem" }}>
        {[
          { label: "Base URL",      val: API_BASE, mono: true },
          { label: "فرمت پاسخ",    val: "JSON", mono: false },
          { label: "احراز هویت",   val: "بدون نیاز", mono: false },
          { label: "Rate Limit",    val: "بدون محدودیت", mono: false },
          { label: "CORS",          val: "* (همه)", mono: false },
          { label: "کش",           val: "۱۲۰ ثانیه", mono: false },
        ].map(({ label, val, mono }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: ".75rem", padding: ".75rem 1rem" }}>
            <div style={{ fontSize: ".7rem", color: "var(--muted)", marginBottom: ".25rem" }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: ".85rem", ...(mono ? { fontFamily: "monospace", color: "#9ee8f8", direction: "ltr" } : {}) }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Endpoints */}
      <h2 style={{ fontWeight: 900, fontSize: "1.1rem", marginBottom: "1rem" }}>Endpoints</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
        {ENDPOINTS.map(ep => <EndpointCard key={ep.path} ep={ep} />)}
      </div>

      {/* Response fields */}
      <div style={{ marginTop: "2rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.25rem" }}>
        <h2 style={{ fontWeight: 900, fontSize: "1rem", marginBottom: "1rem" }}>فیلدهای شیء ملک</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: ".4rem .75rem", fontSize: ".8rem" }}>
          {[
            ["id", "شناسه عددی ملک"],
            ["title", "عنوان ملک"],
            ["city_name", "نام شهر"],
            ["neighborhood_name", "نام محله"],
            ["area", "متراژ (م²)"],
            ["bedrooms", "تعداد اتاق خواب"],
            ["bathrooms", "تعداد حمام"],
            ["price", "قیمت (تومان)"],
            ["price_per_sqm", "قیمت هر متر"],
            ["currency", "واحد پول"],
            ["deal_type", "نوع معامله (sale/rent)"],
            ["deal_type_display", "نوع معامله فارسی"],
            ["property_type_key", "نوع ملک (villa/apartment...)"],
            ["property_type_name", "نوع ملک فارسی"],
            ["is_featured", "ویژه (bool)"],
            ["is_urgent", "فوری (bool)"],
            ["sea_view", "ویو دریا (bool)"],
            ["forest_view", "ویو جنگل (bool)"],
            ["latitude/longitude", "مختصات جغرافیایی"],
            ["primary_image", "تصویر اصلی {image_url}"],
            ["images_data", "آرایه تصاویر"],
            ["last_updated", "تاریخ آخرین ویرایش"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: ".5rem", alignItems: "baseline" }}>
              <code style={{ color: "#9ee8f8", flexShrink: 0 }}>{k}</code>
              <span style={{ color: "var(--muted)" }}>— {v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SDK example */}
      <div style={{ marginTop: "1.5rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.25rem" }}>
        <h2 style={{ fontWeight: 900, fontSize: "1rem", marginBottom: "1rem" }}>مثال کد JavaScript</h2>
        <pre style={{ background: "var(--surface-2)", borderRadius: ".75rem", padding: "1rem", fontSize: ".78rem", overflowX: "auto", direction: "ltr", color: "#a3e635" }}>
{`// خرید ویلا در نوشهر
const res = await fetch('${API_BASE}/properties?city=نوشهر&deal_type=sale&property_type=villa&limit=20');
const { items, pagination } = await res.json();

console.log(\`\${pagination.total} ویلا یافت شد\`);
items.forEach(p => {
  console.log(p.title, p.price, p.area + 'م²');
});`}
        </pre>
      </div>
    </main>
  );
}
