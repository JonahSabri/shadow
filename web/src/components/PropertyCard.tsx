import Link from "next/link";
import { MapPin, Maximize2, BedDouble, Star, Zap, Eye } from "lucide-react";
import type { PropertyListItem } from "@/types/property";
import { formatPrice, dealLabel, imageUrl, propertyHref } from "@/lib/api";

export default function PropertyCard({ p }: { p: PropertyListItem }) {
  const imgSrc = imageUrl(p.primary_image?.image_url);
  const price = formatPrice(p.price, p.currency);
  const deal = dealLabel(p.deal_type);
  const location = [p.neighborhood_name, p.city_name].filter(Boolean).join("، ");

  return (
    <article className="card overflow-hidden" style={{ display: "flex", flexDirection: "column" }}>
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "4/3", background: "var(--surface-2)", overflow: "hidden" }}>
        {imgSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imgSrc}
            alt={p.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            loading="lazy"
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)", fontSize: "2rem" }}>
            🏡
          </div>
        )}

        {/* Badges overlay */}
        <div style={{ position: "absolute", top: ".6rem", right: ".6rem", display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
          <span className={`badge badge-${p.deal_type === "sale" ? "sale" : "rent"}`}>{deal}</span>
          {p.is_featured && <span className="badge badge-featured"><Star size={10} />ویژه</span>}
          {p.is_urgent  && <span className="badge badge-urgent"><Zap  size={10} />فوری</span>}
        </div>

        {/* Type */}
        {p.property_type_name && (
          <div style={{ position: "absolute", bottom: ".6rem", right: ".6rem" }}>
            <span className="badge" style={{ background: "rgba(0,0,0,.65)", color: "#fff" }}>
              {p.property_type_name}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: ".6rem", flex: 1 }}>
        <h3 style={{ fontWeight: 900, fontSize: ".92rem", color: "#fff", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {p.title}
        </h3>

        {location && (
          <div style={{ display: "flex", alignItems: "center", gap: ".3rem", color: "var(--muted)", fontSize: ".75rem" }}>
            <MapPin size={12} />
            {location}
          </div>
        )}

        <div style={{ display: "flex", gap: ".9rem", color: "rgba(255,255,255,.55)", fontSize: ".75rem" }}>
          {p.area && <span><Maximize2 size={11} style={{ display: "inline", marginLeft: ".2rem" }} />{p.area?.toLocaleString("fa-IR")} م²</span>}
          {p.bedrooms != null && p.bedrooms > 0 && <span><BedDouble size={11} style={{ display: "inline", marginLeft: ".2rem" }} />{p.bedrooms?.toLocaleString("fa-IR")} خواب</span>}
          {p.sea_view && <span>🌊 ویو دریا</span>}
          {p.forest_view && <span>🌲 ویو جنگل</span>}
        </div>

        <div style={{ marginTop: "auto", paddingTop: ".75rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".5rem" }}>
          <span style={{ fontWeight: 900, fontSize: ".9rem", color: p.price ? "#fff" : "var(--muted)" }}>{price}</span>
          <Link
            href={propertyHref(p.id, p.title)}
            className="btn btn-primary"
            style={{ padding: ".35rem .9rem", fontSize: ".75rem" }}
          >
            <Eye size={13} />
            جزئیات
          </Link>
        </div>
      </div>
    </article>
  );
}
