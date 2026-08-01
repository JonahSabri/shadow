import type { Metadata } from "next";
import Header from "@/components/Header";
import ApiDocs from "./ApiDocs";

export const metadata: Metadata = {
  title: "مستندات API — املاک شمال",
  description: "راهنمای کامل API رایگان ملک‌های نوشهر و شمال. پارامترها، مثال‌ها و پاسخ‌های JSON.",
};

export default function DocsPage() {
  return (
    <>
      <Header />
      <ApiDocs />
    </>
  );
}
