"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category } from "./page";

type Props = {
  masterCategories: Category[];
  clientCategories: Category[];
};

type Mode = "offer" | "seek" | "growth";

type Group = { title: string; items: string[] };

const SERVICE_GROUPS: Group[] = [
  { title: "Красота и здоровье", items: ["косметология", "массаж", "эпиляция", "наращивание ресниц", "бровист", "татуаж", "маникюр и педикюр", "парикмахер", "визажист"] },
  { title: "Домашняя помощь", items: ["няни", "сиделки", "клининг", "муж на час"] },
  { title: "Туризм", items: ["тур агент"] },
  { title: "Образование", items: ["репетитор", "учитель"] },
  { title: "Фитнес и спорт", items: ["тренер (инструктор)"] },
  { title: "Психология", items: ["психолог", "коуч"] },
  { title: "Дизайн. Интерьер", items: ["мебель", "дизайн"] },
  { title: "Животные", items: ["ветеринарная помощь", "грумминг", "передержка"] },
];

const GROWTH_GROUPS: Group[] = [
  { title: "Ищу", items: ["обучение", "оборудование", "недвижимость", "сотрудников", "юридические услуги", "бухгалтерские услуги", "маркетинг", "консалтинг"] },
  { title: "Предлагаю", items: ["обучение", "оборудование", "недвижимость", "юридические услуги", "бухгалтерские услуги", "маркетинг", "консалтинг"] },
];

export function RoleCategoryPicker({ masterCategories, clientCategories }: Props) {
  const [mode, setMode] = useState<Mode>("offer");

  const dynamicCats = useMemo(() => {
    const base = mode === "offer" ? masterCategories : clientCategories;
    return base.slice(0, 10);
  }, [mode, masterCategories, clientCategories]);

  const groups = mode === "growth" ? GROWTH_GROUPS : SERVICE_GROUPS;

  return (
    <div className="homeBlocks">
      <div className="homeIntro">
        <h1 className="h1">Приветствуем!</h1>
        <p className="lead">Сарафан — это удобная онлайн-платформа, которая объединяет мастеров и клиентов.</p>
      </div>

      <div className="roleButtons">
        <button type="button" className={`btn ${mode === "offer" ? "btnSecondary" : "btnGhost"}`} onClick={() => setMode("offer")}>✅ Предлагаю услугу</button>
        <button type="button" className={`btn ${mode === "seek" ? "btnSecondary" : "btnGhost"}`} onClick={() => setMode("seek")}>✅ Ищу услугу</button>
        <button type="button" className={`btn ${mode === "growth" ? "btnSecondary" : "btnGhost"}`} onClick={() => setMode("growth")}>✅ Развитие специалистов и бизнеса</button>
      </div>

      {dynamicCats.length > 0 && mode !== "growth" ? (
        <div>
          <p className="muted center">Категории из базы:</p>
          <div className="grid2">
            {dynamicCats.map((cat, i) => (
              <Link key={cat.id} href={`/masters?slug=${encodeURIComponent(cat.slug)}`} className={`chip ${["catBlue", "catPurple", "catOrange"][i % 3]}`}>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="manualGroups">
        {groups.map((group) => (
          <section key={group.title} className="groupCard">
            <h3>{group.title}</h3>
            <div className="servicesChips">
              {group.items.map((item) => (
                <Link key={item} href={`/masters?q=${encodeURIComponent(item)}`} className="serviceChip">{item}</Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="ctaRow">
        <Link href="/masters" className="btn btnPrimary">Поиск</Link>
      </div>
    </div>
  );
}
