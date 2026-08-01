"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

const DEAL_TYPES = [
  { value: "", label: "همه" },
  { value: "sale", label: "فروش" },
  { value: "rent", label: "اجاره" },
];
const PROP_TYPES = [
  { value: "", label: "نوع ملک" },
  { value: "villa", label: "ویلا" },
  { value: "apartment", label: "آپارتمان" },
  { value: "land", label: "زمین" },
  { value: "house", label: "خانه" },
];
const CITIES = ["", "نوشهر", "چالوس", "نور", "سیسنگان", "چلک", "چلندر"].map(c => ({
  value: c, label: c || "همه شهرها",
}));

export default function Filters() {
  const router = useRouter();
  const sp = useSearchParams();

  const update = useCallback(
    (key: string, val: string) => {
      const next = new URLSearchParams(sp.toString());
      if (val) next.set(key, val); else next.delete(key);
      next.set("page", "1");
      router.push(`/?${next}`);
    },
    [router, sp]
  );

  const search = sp.get("search") ?? "";
  const deal   = sp.get("deal_type") ?? "";
  const type   = sp.get("property_type") ?? "";
  const city   = sp.get("city") ?? "";
  const hasActive = deal || type || city || search;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", right: ".8rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
        <input
          type="search"
          placeholder="جستجو در عنوان ملک‌ها..."
          defaultValue={search}
          style={{ paddingRight: "2.4rem" }}
          onKeyDown={e => {
            if (e.key === "Enter") update("search", (e.target as HTMLInputElement).value.trim());
          }}
          onBlur={e => update("search", e.target.value.trim())}
        />
      </div>

      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
        {/* Deal type chips */}
        {DEAL_TYPES.map(d => (
          <button
            key={d.value}
            onClick={() => update("deal_type", d.value)}
            className={`btn ${deal === d.value ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: ".35rem .9rem", fontSize: ".8rem" }}
          >
            {d.label}
          </button>
        ))}

        <div style={{ width: 1, background: "var(--border)", margin: "0 .25rem" }} />

        <select value={type} onChange={e => update("property_type", e.target.value)} style={{ width: "auto" }}>
          {PROP_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select value={city} onChange={e => update("city", e.target.value)} style={{ width: "auto" }}>
          {CITIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {hasActive && (
          <button
            className="btn btn-ghost"
            style={{ padding: ".35rem .75rem", fontSize: ".8rem", color: "#ef4444", borderColor: "rgba(239,68,68,.25)" }}
            onClick={() => {
              router.push("/");
            }}
          >
            <X size={13} />
            پاک‌کردن
          </button>
        )}
      </div>

      {/* SEO keyword links */}
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", paddingTop: ".25rem" }}>
        {[
          { label: "خرید ویلا نوشهر",       q: { deal_type: "sale", property_type: "villa",     city: "نوشهر" } },
          { label: "خرید آپارتمان نوشهر",    q: { deal_type: "sale", property_type: "apartment", city: "نوشهر" } },
          { label: "خرید ویلا چالوس",        q: { deal_type: "sale", property_type: "villa",     city: "چالوس" } },
          { label: "خرید آپارتمان چالوس",    q: { deal_type: "sale", property_type: "apartment", city: "چالوس" } },
          { label: "اجاره ویلا شمال",        q: { deal_type: "rent", property_type: "villa",     city: "" } },
          { label: "ویلای ساحلی",            q: { property_type: "villa", sea_view: "true" } },
        ].map(({ label, q }) => (
          <button
            key={label}
            onClick={() => {
              const next = new URLSearchParams();
              Object.entries(q).forEach(([k, v]) => v && next.set(k, v));
              next.set("page", "1");
              router.push(`/?${next}`);
            }}
            style={{
              background: "rgba(255,255,255,.04)", border: "1px solid var(--border)",
              borderRadius: "999px", padding: ".2rem .7rem", fontSize: ".72rem",
              color: "var(--muted)", cursor: "pointer", fontFamily: "inherit",
              transition: "all .2s",
            }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(192,57,43,.4)"; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
