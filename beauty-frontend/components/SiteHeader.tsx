"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const onBack = () => {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.back();
  };

  return (
    <header className="siteHeader modernHeader">
      <div className="container topBar">
        <button type="button" className="iconBtn" onClick={onBack} aria-label="Назад">←</button>
        <Link href="/" className="brand" aria-label="Сарафан">
          <BrandLogo className="brandLogo" />
          <span>САРАФАН</span>
        </Link>
        <div className="iconBtn iconBtnGhost" aria-hidden />
      </div>
    </header>
  );
}
