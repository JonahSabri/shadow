import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Code2, Zap, Globe, Shield } from "lucide-react";
import Header from "@/components/Header";
import PropertyCard from "@/components/PropertyCard";
import Filters from "@/components/Filters";
import Pagination from "@/components/Pagination";
import { fetchProperties } from "@/lib/api";

export const metadata: Metadata = {
  title: "لیست ملک‌های نوشهر و شمال — املاک شمال",
  description:
    "لیست کامل ملک‌های فروش و اجاره در نوشهر، چالوس، نور و شمال ایران. خرید ویلا، آپارتمان و زمین.",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

async function PropertyList({ sp }: { sp: Record<string, string> }) {
  const page = parseInt(sp.page ?? "1", 10);
  const limit = 18;

  const data = await fetchProperties({
    page,
    limit,
    search: sp.search,
    city: sp.city,
    deal_type: sp.deal_type,
    property_type: sp.property_type,
    min_price: sp.min_price,
    max_price: sp.max_price,
    min_area: sp.min_area,
    max_area: sp.max_area,
    sea_view: sp.sea_view,
  });

  if (!data.items.length) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--muted)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <h3 style={{ fontWeight: 700, color: "#fff", marginBottom: ".5rem" }}>ملکی یافت نشد</h3>
        <p style={{ fontSize: ".875rem" }}>فیلترها را تغییر دهید</p>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.25rem",
        paddingTop: "1.25rem",
      }}>
        {data.items.map(p => <PropertyCard key={p.id} p={p} />)}
      </div>
      <Pagination pagination={data.pagination} />
    </>
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "3rem 1rem 2rem", marginBottom: "1.5rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: ".5rem",
            background: "rgba(192,57,43,.12)", border: "1px solid rgba(192,57,43,.3)",
            borderRadius: "999px", padding: ".3rem 1rem", fontSize: ".78rem", color: "#e74c3c",
            fontWeight: 700, marginBottom: "1.25rem",
          }}>
            <Zap size={13} />
            API رایگان · بدون نیاز به ثبت‌نام
          </div>

          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, lineHeight: 1.3, marginBottom: "1rem" }}>
            داده‌های ملکی{" "}
            <span style={{ color: "#c0392b" }}>نوشهر و شمال</span>
            <br />
            به صورت رایگان
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1rem", maxWidth: 540, margin: "0 auto 2rem" }}>
            ملک‌های فروش و اجاره در نوشهر، چالوس، نور و شمال ایران — از طریق API JSON مستند.
            خرید ویلا، آپارتمان، زمین و بیشتر.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: ".75rem", flexWrap: "wrap" }}>
            {[
              { icon: Code2,  label: "JSON REST API" },
              { icon: Globe,  label: "CORS آزاد" },
              { icon: Shield, label: "بدون محدودیت" },
              { icon: Zap,    label: "کش ۱۲۰ ثانیه" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} style={{
                display: "inline-flex", alignItems: "center", gap: ".4rem",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: ".6rem", padding: ".4rem .9rem",
                fontSize: ".8rem", color: "rgba(255,255,255,.75)",
              }}>
                <Icon size={13} style={{ color: "#c0392b" }} />
                {label}
              </span>
            ))}
          </div>

          {/* API quick link */}
          <div style={{ marginTop: "1.5rem" }}>
            <Link
              href="/docs"
              className="btn btn-primary"
              style={{ fontSize: ".9rem", padding: ".6rem 1.5rem" }}
            >
              <Code2 size={16} />
              مشاهده مستندات API
            </Link>
          </div>
        </section>

        {/* Filter + List */}
        <section
          style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "1.25rem", padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: 900, fontSize: "1.1rem" }}>
              لیست ملک‌های نوشهر و شمال
            </h2>
          </div>

          <Suspense fallback={null}>
            <Filters />
          </Suspense>

          <Suspense fallback={
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1.25rem", paddingTop: "1.25rem" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ borderRadius: "1rem", overflow: "hidden", background: "var(--surface-2)" }}>
                  <div className="skeleton" style={{ aspectRatio: "4/3" }} />
                  <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: ".6rem" }}>
                    <div className="skeleton" style={{ height: 18, width: "80%" }} />
                    <div className="skeleton" style={{ height: 14, width: "55%" }} />
                    <div className="skeleton" style={{ height: 14, width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          }>
            <PropertyList sp={sp} />
          </Suspense>
        </section>

        {/* SEO text */}
        <section style={{ marginTop: "2.5rem", padding: "1.5rem", background: "var(--surface)", borderRadius: "1rem", border: "1px solid var(--border)" }}>
          <h2 style={{ fontWeight: 900, marginBottom: ".75rem", fontSize: "1rem" }}>خرید ویلا و آپارتمان در نوشهر</h2>
          <p style={{ color: "var(--muted)", fontSize: ".875rem", lineHeight: 1.9 }}>
            نوشهر یکی از محبوب‌ترین مناطق شمال ایران برای خرید ملک است. این شهر با ساحل دریای خزر، جنگل‌های سرسبز
            و آب‌وهوای معتدل، مقصد اصلی خریداران ویلا و آپارتمان در شمال است. از طریق این API می‌توانید به لیست
            کامل ملک‌های{" "}
            <strong style={{ color: "#fff" }}>خرید ویلا نوشهر</strong>،{" "}
            <strong style={{ color: "#fff" }}>خرید آپارتمان نوشهر</strong>،{" "}
            <strong style={{ color: "#fff" }}>خرید ویلا چالوس</strong> و{" "}
            <strong style={{ color: "#fff" }}>زمین در شمال</strong> دسترسی JSON داشته باشید.
          </p>
        </section>
      </main>
    </>
  );
}
