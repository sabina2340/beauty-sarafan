import type { Metadata } from "next";
import { RoleCategoryPicker } from "./role-category-picker";
import { BrandLogo } from "@/components/BrandLogo";
import { HotOffersCarousel } from "@/components/ads/HotOffersCarousel";
import { SarafanFindsInstallHint } from "@/components/ads/SarafanFindsInstallHint";
import { StoriesFeed } from "@/components/StoriesFeed";
import { SupportForm } from "@/components/SupportForm";
import { buildApiUrl } from "@/lib/api-base";
import type { MasterCard } from "@/lib/types";

type CategoryItem = {
  id: number;
  name: string;
  slug: string;
};

export type CategoryGroup = {
  group_name: string;
  group_title: string;
  is_business: boolean;
  items: CategoryItem[];
};

export const metadata: Metadata = {
  title: "Сарафан",
  description: "Мобильная платформа-каталог специалистов",
};

function normalizeCategoryGroups(data: unknown): CategoryGroup[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((group) => {
    const normalizedGroup = group as Partial<CategoryGroup>;
    const items = Array.isArray(normalizedGroup.items) ? normalizedGroup.items : [];

    return {
      group_name: String(normalizedGroup.group_name ?? ""),
      group_title: String(normalizedGroup.group_title ?? normalizedGroup.group_name ?? ""),
      is_business: Boolean(normalizedGroup.is_business),
      items: items.map((item) => {
        const normalizedItem = item as Partial<CategoryItem>;
        return {
          id: Number(normalizedItem.id ?? 0),
          name: String(normalizedItem.name ?? ""),
          slug: String(normalizedItem.slug ?? ""),
        };
      }),
    };
  });
}

async function getCategoryGroups() {
  const res = await fetch(buildApiUrl("/category-groups"), {
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  return normalizeCategoryGroups(data);
}

async function getMastersWithStories(): Promise<MasterCard[]> {
  const res = await fetch(buildApiUrl("/masters"), { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? (data as MasterCard[]) : [];
}

export default async function HomePage() {
  const groups = await getCategoryGroups().catch(() => []);
  const safeGroups = Array.isArray(groups) ? groups : [];
  const masters = await getMastersWithStories().catch(() => []);

  return (
    <section className="homePage">
      <div className="homeHero">
        <BrandLogo className="homeLogo" />
      </div>
      <StoriesFeed masters={masters} />
      <div id="categories" className="homeContent card">
        <RoleCategoryPicker groups={safeGroups} />
      </div>
      <SarafanFindsInstallHint />
      <HotOffersCarousel />
      <SupportForm />
    </section>
  );
}
