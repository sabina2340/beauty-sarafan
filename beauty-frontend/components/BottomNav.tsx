"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authMe, logout, type AuthMe } from "@/lib/auth-api";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  action?: "logout";
};

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<AuthMe | null>(null);

  useEffect(() => {
    let active = true;
    authMe().then((data) => active && setMe(data)).catch(() => active && setMe(null));
    return () => {
      active = false;
    };
  }, [pathname]);

  const items = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      { href: "/#categories", label: "Категории", icon: "🧭" },
      { href: "/", label: "Главная", icon: "🏠" },
      { href: "/hot-offers", label: "Горячее", icon: "🔥" },
      { href: "/masters", label: "Мастера", icon: "🔎" },
    ];

    if (!me) {
      return [...base, { href: "/login", label: "Вход", icon: "🔐" }];
    }

    return [
      ...base,
      { href: "/profile", label: "Кабинет", icon: "👤" },
      { href: "/account/ads", label: "Объявления", icon: "📣" },
      { href: "#", label: "Выйти", icon: "🚪", action: "logout" },
    ];
  }, [me]);

  const onLogout = async () => {
    try {
      await logout();
      setMe(null);
      router.push("/login");
      router.refresh();
    } catch {
      // ignore
    }
  };

  return (
    <nav className="bottomNav" aria-label="Нижняя навигация">
      {items.map((item) => {
        const isHomeCategory = item.href.startsWith("/#") && pathname === "/";
        const active = isHomeCategory || pathname === item.href || (item.href !== "/" && !item.href.startsWith("/#") && pathname.startsWith(item.href));

        if (item.action === "logout") {
          return (
            <button key={item.label} type="button" className="bottomNavItem" onClick={onLogout}>
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        }

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
