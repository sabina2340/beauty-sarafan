"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authMe } from "@/lib/auth-api";
import type { CategoryGroup } from "./page";

type Props = {
  groups: CategoryGroup[];
};

type Mode = "offer" | "seek" | "growth";

export function RoleCategoryPicker({ groups }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("offer");

  const shownGroups = useMemo(() => {
    if (mode === "growth") return groups.filter((g) => g.is_business);
    return groups.filter((g) => !g.is_business);
  }, [groups, mode]);

  const onOfferClick = async (categoryId: number) => {
    try {
      await authMe();
      router.push(`/profile?category_id=${categoryId}`);
    } catch {
      router.push(`/register?category_id=${categoryId}`);
    }
  };

  return (
    <div className="homeBlocks">
      <div className="homeIntro">
        <h1 className="h1">Приветствуем!</h1>
        <p className="lead">Сарафан - это удобная, современная онлайн - платформа, которая объединяет самые топовые услуги для всей семьи и их клиентов по всей России.</p>
      </div>

      <div className="roleButtons">
        <button type="button" className={`btn ${mode === "offer" ? "btnSecondary" : "btnGhost"}`} onClick={() => setMode("offer")}>✅ Разместить бесплатно услугу</button>
        <button type="button" className={`btn ${mode === "seek" ? "btnSecondary" : "btnGhost"}`} onClick={() => setMode("seek")}>✅ Ищу услугу</button>
        <button type="button" className={`btn ${mode === "growth" ? "btnSecondary" : "btnGhost"}`} onClick={() => setMode("growth")}>✅ Для роста и бизнеса</button>
      </div>

      <div className="manualGroups">
        {shownGroups.map((group) => (
          <section key={group.group_name} className="groupCard">
            <h3>{group.group_title}</h3>
            <div className="servicesChips">
              {group.items.map((item) => (
                mode === "offer" ? (
                  <button key={item.id} type="button" className="serviceChip serviceChipBtn" onClick={() => onOfferClick(item.id)}>{item.name}</button>
                ) : (
                  <Link key={item.id} href={`/masters?slug=${encodeURIComponent(item.slug)}`} className="serviceChip">{item.name}</Link>
                )
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="ctaRow">
        <Link href="/masters" className="btn btnPrimary">Перейти в каталог</Link>
      </div>
    </div>
  );
}
