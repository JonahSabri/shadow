import type { Metadata } from "next";
import Header from "@/components/Header";
import ApiDocs from "./ApiDocs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "مستندات API",
  description: "راهنمای کامل API رایگان ملک‌های نوشهر و شمال. پارامترها، مثال‌ها و پاسخ‌های JSON.",
  alternates: { canonical: `${SITE_URL}/docs` },
};

export default function DocsPage() {
  return (
    <>
      <Header />
      <ApiDocs />
    </>
  );
}
