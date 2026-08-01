import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "املاک شمال — داده رایگان ملک نوشهر و شمال",
    template: "%s | املاک شمال",
  },
  description:
    "API رایگان و مستند برای دسترسی به ملک‌های خرید و اجاره در نوشهر، چالوس، نور و شمال ایران. داده‌های ملکی با JSON خوانا و pagination.",
  keywords: [
    "API ملک نوشهر", "خرید ویلا نوشهر API", "داده رایگان ملک شمال",
    "خرید آپارتمان نوشهر", "املاک شمال API", "real estate API Iran",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "املاک شمال — داده رایگان ملک شمال ایران",
    description: "API رایگان ملک‌های نوشهر، چالوس، نور و شمال",
    locale: "fa_IR",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
