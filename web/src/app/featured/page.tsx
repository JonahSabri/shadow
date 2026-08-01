import type { Metadata } from "next";
import { Star } from "lucide-react";
import Header from "@/components/Header";
import PropertyCard from "@/components/PropertyCard";
import { fetchFeatured } from "@/lib/api";

export const metadata: Metadata = {
  title: "ملک‌های ویژه نوشهر — املاک شمال",
  description: "ملک‌های فوری و ویژه برای خرید و اجاره در نوشهر، چالوس و شمال ایران.",
};

export default async function FeaturedPage() {
  const items = await fetchFeatured(24);

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.75rem" }}>
          <Star size={22} style={{ color: "#C9A84C" }} />
          <h1 style={{ fontWeight: 900, fontSize: "1.5rem" }}>ملک‌های ویژه و فوری</h1>
          <span style={{ marginRight: "auto", fontSize: ".8rem", color: "var(--muted)" }}>{items.length.toLocaleString("fa-IR")} ملک</span>
        </div>

        {items.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "4rem" }}>در حال حاضر ملک ویژه‌ای وجود ندارد.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1.25rem" }}>
            {items.map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </main>
    </>
  );
}
