"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { Pagination as PaginationProps } from "@/types/property";

export default function Pagination({ pagination }: { pagination: PaginationProps }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { page, pages, total, limit } = pagination;

  const go = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(p));
    router.push(`/?${next}`);
  };

  if (pages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".75rem", paddingTop: "1.5rem", flexWrap: "wrap" }}>
      <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>
        نمایش {start.toLocaleString("fa-IR")}–{end.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")} ملک
      </span>

      <div style={{ display: "flex", gap: ".4rem" }}>
        <button
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className="btn btn-ghost"
          style={{ padding: ".4rem .75rem", fontSize: ".8rem", opacity: page <= 1 ? .3 : 1 }}
        >
          <ChevronRight size={15} />
          قبلی
        </button>

        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          let p: number;
          if (pages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= pages - 2) p = pages - 4 + i;
          else p = page - 2 + i;
          return (
            <button
              key={p}
              onClick={() => go(p)}
              className={`btn ${p === page ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: ".4rem .75rem", fontSize: ".8rem", minWidth: 36 }}
            >
              {p.toLocaleString("fa-IR")}
            </button>
          );
        })}

        <button
          disabled={page >= pages}
          onClick={() => go(page + 1)}
          className="btn btn-ghost"
          style={{ padding: ".4rem .75rem", fontSize: ".8rem", opacity: page >= pages ? .3 : 1 }}
        >
          بعدی
          <ChevronLeft size={15} />
        </button>
      </div>
    </div>
  );
}
