"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authMe, type AuthMe } from "@/lib/auth-api";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
};

export function BottomNav() {
  const pathname = usePathname();
  const [me, setMe] = useState<AuthMe | null>(null);

  useEffect(() => {
    let active = true;
    authMe().then((data) => active && setMe(data)).catch(() => active && setMe(null));
    return () => {
      active = false;
    };
  }, [pathname]);

  const items = useMemo<NavItem[]>(() => {
    const guestItems: NavItem[] = [
      { href: "/", label: "Главная", icon: "🏠" },
      { href: "/hot-offers", label: "Горячее", icon: "🔥" },
      { href: "/masters", label: "Мастера", icon: "🔎" },
      { href: "/login", label: "Вход", icon: "🔐" },
      { href: "/register", label: "Регистрация", icon: "📝" },
    ];

    if (!me) return guestItems;

    return [
      { href: "/", label: "Главная", icon: "🏠" },
      { href: "/hot-offers", label: "Горячее", icon: "🔥" },
      { href: "/masters", label: "Мастера", icon: "🔎" },
      { href: "/account/ads", label: "Объявления", icon: "📣", requiresAuth: true },
      { href: "/profile", label: "Кабинет", icon: "👤", requiresAuth: true },
    ];
  }, [me]);

  return (
    <nav className="bottomNav" aria-label="Нижняя навигация">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={`bottomNavItem ${active ? "active" : ""}`}>
            <span aria-hidden>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
