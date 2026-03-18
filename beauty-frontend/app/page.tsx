import type { Metadata } from "next";
import { RoleCategoryPicker } from "./role-category-picker";
import { BrandLogo } from "@/components/BrandLogo";
import { HotOffersCarousel } from "@/components/ads/HotOffersCarousel";
import { SupportForm } from "@/components/SupportForm";

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

function getApiBaseUrl() {
    if (process.env.INTERNAL_API_URL) {
        return process.env.INTERNAL_API_URL;
    }

    if (process.env.NODE_ENV === "production") {
        return "http://backend:8080";
    }

    return "http://localhost:8080";
}

async function getCategoryGroups() {
    const res = await fetch(`${getApiBaseUrl()}/category-groups`, {
        cache: "no-store",
    });

    if (!res.ok) return [];
    return (await res.json()) as CategoryGroup[];
}

export default async function HomePage() {
    const groups = await getCategoryGroups();

    return (
        <section className="homePage">
            <div className="homeHero">
                <BrandLogo className="homeLogo" />
            </div>
            <div id="categories" className="homeContent card">
                <RoleCategoryPicker groups={groups} />
            </div>
            <HotOffersCarousel />
            <SupportForm />
        </section>
    );
}