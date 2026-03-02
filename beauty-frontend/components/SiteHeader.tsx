"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { authMe, type AuthMe } from "@/lib/auth-api";

export function SiteHeader() {
  const [me, setMe] = useState<AuthMe | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    authMe()
      .then((data) => {
        if (active) setMe(data);
      })
      .catch(() => {
        if (active) setMe(null);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  const canModerate = me?.role === "admin" || me?.role === "moderator";

  return (
    <header className="siteHeader">
      <div className="container navWrap">
        <Link href="/" className="brand" aria-label="Beauty Sarafan home">
          Beauty Sarafan
        </Link>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/">Главная</Link>
          <Link href="/masters">Мастера</Link>
          {canModerate ? <Link href="/admin">Админ</Link> : null}
          {me ? (
            <Link href="/profile">Профиль</Link>
          ) : (
            <>
              <Link href="/login">Вход</Link>
              <Link href="/register">Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
