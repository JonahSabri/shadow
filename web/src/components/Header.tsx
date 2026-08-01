"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Home, BookOpen, Zap } from "lucide-react";

const NAV = [
  { href: "/",         label: "ملک‌ها",      icon: Home },
  { href: "/docs",     label: "مستندات API", icon: BookOpen },
  { href: "/featured", label: "ویژه",        icon: Zap },
];

export default function Header() {
  const path = usePathname();
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(9,9,11,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="header-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, gap: ".5rem" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: ".5rem", textDecoration: "none", minWidth: 0 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: ".5rem", flexShrink: 0,
            background: "linear-gradient(135deg,#c0392b,#e74c3c)",
            fontSize: "1rem",
          }}>
            <Code2 size={17} color="#fff" />
          </span>
          <span className="brand-text" style={{ fontWeight: 900, fontSize: ".95rem", color: "#fff", letterSpacing: "-.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            املاک شمال <span style={{ color: "#c0392b" }}>API</span>
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", gap: ".25rem", flexShrink: 0 }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className="nav-link"
                style={{
                  display: "flex", alignItems: "center", gap: ".35rem",
                  padding: ".35rem .8rem", borderRadius: ".6rem",
                  fontSize: ".8rem", fontWeight: 700, textDecoration: "none",
                  background: active ? "rgba(192,57,43,0.2)" : "transparent",
                  color: active ? "#e74c3c" : "rgba(255,255,255,.65)",
                  border: active ? "1px solid rgba(192,57,43,0.35)" : "1px solid transparent",
                  transition: "all .2s",
                }}
              >
                <Icon size={14} />
                <span className="nav-label">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
