import type { Metadata } from "next";
import { RoleCategoryPicker } from "./role-category-picker";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Сарафан",
  description: "Мобильная платформа-каталог бьюти-мастеров",
};

type CategoryApi = {
  ID: number;
  Name: string;
  Slug: string;
  Audience: "master" | "client" | "both";
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  audience: "master" | "client" | "both";
};

async function getCategories(audience: "master" | "client") {
  const res = await fetch(`http://localhost:8080/categories?audience=${audience}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as CategoryApi[];
  return data.map((c) => ({ id: c.ID, name: c.Name, slug: c.Slug, audience: c.Audience })) as Category[];
}

export default async function HomePage() {
  const [masterCategories, clientCategories] = await Promise.all([getCategories("master"), getCategories("client")]);

  return (
    <section className="homePage">
      <div className="homeHero">
        <BrandLogo className="homeLogo" />
      </div>
      <div className="homeContent card">
        <RoleCategoryPicker masterCategories={masterCategories} clientCategories={clientCategories} />
      </div>
    </section>
  );
}
