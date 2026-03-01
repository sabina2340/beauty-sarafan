import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Beauty Sarafan",
  description: "Каталог мастеров красоты",
  openGraph: {
    title: "Beauty Sarafan",
    description: "Найдите мастера в вашем городе",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <SiteHeader />
        <main className="container page">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
