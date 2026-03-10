"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authMe, logout, type AuthMe } from "@/lib/auth-api";
import { BrandLogo } from "@/components/BrandLogo";

export function SiteHeader() {
  const [me, setMe] = useState<AuthMe | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    authMe().then((data) => active && setMe(data)).catch(() => active && setMe(null));
    return () => { active = false; };
  }, [pathname]);

  const canModerate = me?.role === "admin" || me?.role === "moderator";

  const onLogout = async () => {
    try {
      await logout();
      setMe(null);
      setMenuOpen(false);
      router.push("/login");
      router.refresh();
    } catch {}
  };

  const links = [
    { href: "/", label: "Главная" },
    { href: "/hot-offers", label: "Горячие предложения" },
    { href: "/masters", label: "Каталог" },
    ...(canModerate ? [{ href: "/admin", label: "Админ" }] : []),
    ...(me ? [{ href: "/profile", label: "Профиль" }, { href: "/account/ads", label: "Мои объявления" }] : [{ href: "/login", label: "Вход" }, { href: "/register", label: "Регистрация" }]),
  ];

  return (
    <header className="siteHeader">
      <div className="container topBar">
        <button type="button" className="iconBtn" onClick={() => router.back()} aria-label="Назад">←</button>
        <Link href="/" className="brand" aria-label="Сарафан">
          <BrandLogo className="brandLogo" />
          <span>САРАФАН</span>
        </Link>
        <button type="button" className="iconBtn" onClick={() => setMenuOpen((v) => !v)} aria-label="Меню">⋮</button>
      </div>
      {menuOpen ? (
        <nav className="mobileMenu">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>
          ))}
          {me ? <button type="button" className="btn btnGhost menuBtn" onClick={onLogout}>Выйти</button> : null}
        </nav>
      ) : null}
    </header>
  );
}
