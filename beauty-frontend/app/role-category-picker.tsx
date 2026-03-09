"use client";

import Link from "next/link";
import type { Category } from "./page";

type Props = {
  masterCategories: Category[];
  clientCategories: Category[];
};

const palette = ["catBlue", "catPurple", "catOrange", "catPurple", "catOrange", "catBlue"];

export function RoleCategoryPicker({ masterCategories, clientCategories }: Props) {
  const merged = [...masterCategories, ...clientCategories].slice(0, 6);

  return (
    <div className="homeBlocks">
      <div className="homeIntro">
        <h1 className="h1">Приветствуем!</h1>
        <p className="lead">Сарафан — это удобная онлайн-платформа, которая объединяет мастеров и клиентов.</p>
      </div>

      <div>
        <h2 className="h2">Вы бьюти-специалист ?</h2>
        <p className="muted center">Выберите категорию</p>

        <div className="grid2">
          {merged.map((cat, i) => (
            <Link key={cat.id} href={`/masters?slug=${encodeURIComponent(cat.slug)}`} className={`chip ${palette[i % palette.length]}`}>
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="ctaRow">
        <Link href="/masters" className="btn btnPrimary">Поиск</Link>
      </div>
    </div>
  );
}
