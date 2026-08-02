import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Maximize2, BedDouble, Bath, Car, ArrowRight, Star, Zap, Code2, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import { fetchPropertyDetail, formatPrice, dealLabel, imageUrl } from "@/lib/api";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await fetchPropertyDetail(parseInt(id, 10));
  if (!p) return { title: "ملک یافت نشد" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/property/${p.id}`;
  const description = (p.description || p.title).slice(0, 160);
  const cover = imageUrl(p.primary_image?.image_url);
  const location = [p.neighborhood_name, p.city_name].filter(Boolean).join("، ");

  const keywords = [
    p.property_type_name,
    p.city_name,
    p.neighborhood_name,
    p.deal_type_display,
    location && `${p.property_type_name} در ${location}`,
  ].filter(Boolean) as string[];

  return {
    title: p.title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: p.title,
      description,
      locale: "fa_IR",
      ...(cover ? { images: [{ url: cover }] } : {}),
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title: p.title,
      description,
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const p = await fetchPropertyDetail(parseInt(id, 10));
  if (!p) notFound();

  const images = p.images_data?.length
    ? p.images_data
    : p.primary_image
    ? [{ id: 0, image_url: p.primary_image.image_url }]
    : [];

  const price = formatPrice(p.price, p.currency);
  const deal = dealLabel(p.deal_type);
  const location = [p.neighborhood_name, p.city_name].filter(Boolean).join("، ");

  const specs = [
    p.area         ? { label: "متراژ",     val: `${p.area.toLocaleString("fa-IR")} م²` }  : null,
    p.bedrooms     ? { label: "اتاق",       val: String(p.bedrooms) }       : null,
    p.bathrooms    ? { label: "حمام",       val: String(p.bathrooms) }      : null,
    p.floor        ? { label: "طبقه",       val: String(p.floor) }         : null,
    p.total_floors ? { label: "کل طبقات",  val: String(p.total_floors) }  : null,
    p.year_built   ? { label: "سال ساخت",  val: String(p.year_built) }    : null,
    p.parking_spaces ? { label: "پارکینگ", val: String(p.parking_spaces) } : null,
  ].filter(Boolean) as { label: string; val: string }[];

  // JSON-LD
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const propertyUrl = `${siteUrl}/property/${p.id}`;
  const allImageUrls = images.map((img) => imageUrl(img.image_url)).filter(Boolean) as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": propertyUrl,
    name: p.title,
    description: p.description || p.title,
    url: propertyUrl,
    ...(allImageUrls.length ? { image: allImageUrls } : {}),
    ...(p.last_updated ? { datePosted: p.last_updated, dateModified: p.last_updated } : {}),
    address: {
      "@type": "PostalAddress",
      ...(p.address ? { streetAddress: p.address } : {}),
      ...(p.neighborhood_name ? { addressLocality: p.neighborhood_name } : {}),
      addressRegion: p.city_name || "مازندران",
      addressCountry: "IR",
    },
    ...(p.latitude && p.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude } }
      : {}),
    ...(p.area ? { floorSize: { "@type": "QuantitativeValue", value: p.area, unitCode: "MTK" } } : {}),
    ...(p.bedrooms ? { numberOfBedroomsTotal: p.bedrooms } : {}),
    ...(p.bathrooms ? { numberOfBathroomsTotal: p.bathrooms } : {}),
    offers: {
      "@type": "Offer",
      price: p.price ?? 0,
      priceCurrency: p.currency === "Toman" ? "IRR" : "IRR",
      availability: "https://schema.org/InStock",
      url: propertyUrl,
      businessFunction:
        p.deal_type === "rent" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: siteUrl },
      ...(p.city_name
        ? [{ "@type": "ListItem", position: 2, name: p.city_name, item: `${siteUrl}/?city=${encodeURIComponent(p.city_name)}` }]
        : []),
      { "@type": "ListItem", position: p.city_name ? 3 : 2, name: p.title, item: propertyUrl },
    ],
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1rem" }}>
        {/* Back */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", color: "var(--muted)", fontSize: ".82rem", marginBottom: "1.25rem", textDecoration: "none" }}>
          <ArrowRight size={14} />
          بازگشت به لیست
        </Link>

        <div className="property-detail-grid" style={{ display: "grid", gap: "1.5rem", alignItems: "start" }}>

          {/* Left — Images + Info */}
          <div>
            {/* Main image */}
            <div style={{ borderRadius: "1rem", overflow: "hidden", aspectRatio: "4/3", background: "var(--surface-2)", marginBottom: "1rem" }}>
              {images[0]?.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl(images[0].image_url) ?? undefined}
                  alt={p.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "4rem" }}>🏡</div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div style={{ display: "flex", gap: ".5rem", overflowX: "auto", paddingBottom: ".25rem" }}>
                {images.slice(1).map((img, i) => img.image_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={img.id ?? i}
                    src={imageUrl(img.image_url) ?? undefined}
                    alt={`تصویر ${i + 2}`}
                    style={{ width: 80, height: 60, objectFit: "cover", borderRadius: ".5rem", flexShrink: 0, cursor: "pointer", border: "1px solid var(--border)" }}
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {/* Description */}
            {p.description && (
              <div style={{ marginTop: "1.5rem" }}>
                <h2 style={{ fontWeight: 900, marginBottom: ".75rem", fontSize: "1rem" }}>توضیحات</h2>
                <p style={{ color: "rgba(255,255,255,.75)", fontSize: ".875rem", lineHeight: 2, whiteSpace: "pre-wrap" }}>{p.description}</p>
              </div>
            )}

            {/* Features */}
            {p.features?.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <h2 style={{ fontWeight: 900, marginBottom: ".75rem", fontSize: "1rem" }}>امکانات</h2>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  {p.features.map(f => (
                    <span key={f} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: ".5rem", padding: ".3rem .7rem", fontSize: ".78rem" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* API Example */}
            <div style={{ marginTop: "1.5rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".75rem" }}>
                <Code2 size={15} style={{ color: "#c0392b" }} />
                <span style={{ fontWeight: 700, fontSize: ".85rem" }}>API Endpoint</span>
              </div>
              <code style={{ display: "block", background: "var(--surface-2)", borderRadius: ".6rem", padding: ".75rem 1rem", fontSize: ".78rem", color: "#9ee8f8", overflowX: "auto", direction: "ltr" }}>
                {`GET /properties/${p.id}`}
              </code>
              <Link href="/docs" style={{ display: "inline-flex", alignItems: "center", gap: ".35rem", marginTop: ".75rem", fontSize: ".78rem", color: "#c0392b", textDecoration: "none" }}>
                مشاهده مستندات کامل
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Right — Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card" style={{ padding: "1.25rem" }}>
              {/* Badges */}
              <div style={{ display: "flex", gap: ".4rem", marginBottom: ".9rem", flexWrap: "wrap" }}>
                <span className={`badge badge-${p.deal_type === "sale" ? "sale" : "rent"}`}>{deal}</span>
                {p.is_featured && <span className="badge badge-featured"><Star size={10} />ویژه</span>}
                {p.is_urgent   && <span className="badge badge-urgent"><Zap  size={10} />فوری</span>}
                {p.property_type_name && <span className="badge" style={{ background: "rgba(255,255,255,.07)", color: "#fff" }}>{p.property_type_name}</span>}
              </div>

              <h1 style={{ fontWeight: 900, fontSize: "1.1rem", lineHeight: 1.6, marginBottom: ".75rem" }}>{p.title}</h1>

              {location && (
                <div style={{ display: "flex", alignItems: "center", gap: ".4rem", color: "var(--muted)", fontSize: ".82rem", marginBottom: "1rem" }}>
                  <MapPin size={14} />
                  {location}
                </div>
              )}

              {/* Price */}
              <div style={{ background: "var(--surface-2)", borderRadius: ".75rem", padding: ".9rem", marginBottom: "1rem", textAlign: "center" }}>
                <div style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: ".25rem" }}>{deal === "فروش" ? "قیمت کل" : "اجاره ماهیانه"}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: p.price ? "#fff" : "var(--muted)" }}>{price}</div>
                {p.price_per_sqm && p.area && (
                  <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: ".25rem" }}>
                    {formatPrice(p.price_per_sqm, p.currency)} / م²
                  </div>
                )}
              </div>

              {/* Specs */}
              {specs.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem", marginBottom: "1rem" }}>
                  {specs.map(s => (
                    <div key={s.label} style={{ background: "var(--surface-2)", borderRadius: ".6rem", padding: ".6rem .75rem" }}>
                      <div style={{ fontSize: ".68rem", color: "var(--muted)", marginBottom: ".15rem" }}>{s.label}</div>
                      <div style={{ fontWeight: 900, fontSize: ".88rem" }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mini API box */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1rem", fontSize: ".78rem", color: "var(--muted)" }}>
              <div style={{ fontWeight: 700, color: "#fff", marginBottom: ".5rem" }}>ID ملک: <code style={{ color: "#9ee8f8" }}>{p.id}</code></div>
              {p.last_updated && (
                <div>آخرین بروزرسانی: {new Date(p.last_updated).toLocaleDateString("fa-IR")}</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
