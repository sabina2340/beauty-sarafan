import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Сарафан",
    statusBarStyle: "default",
  },
  title: "Сарафан",
  description: "Мобильный каталог бьюти-мастеров",
  icons: {
    icon: "/logo-placeholder.png",
    apple: "/logo-placeholder.png",
  },
  openGraph: {
    title: "Сарафан",
    description: "Найдите мастера в вашем городе",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <SiteHeader />
        <main className="container page">{children}</main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
