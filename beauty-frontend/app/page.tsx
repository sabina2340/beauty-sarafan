import type { Metadata } from "next";
import { RoleCategoryPicker } from "./role-category-picker";

export const metadata: Metadata = {
    title: "Сарафан — услуги для всей семьи",
    description:
        "Сарафан — удобная, современная онлайн-платформа, которая объединяет самые топовые услуги для всей семьи и их клиентов.",
    openGraph: {
        title: "Сарафан — услуги для всей семьи",
        description:
            "Вы предлагаете услуги или ищете услугу? Выберите роль и категорию.",
        type: "website",
    },
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
    const res = await fetch(
        `http://localhost:8080/categories?audience=${audience}`,
        { cache: "no-store" }
    );

    if (!res.ok) throw new Error(`Failed to load ${audience} categories`);

    const data = (await res.json()) as CategoryApi[];

    return data.map((c) => ({
        id: c.ID,
        name: c.Name,
        slug: c.Slug,
        audience: c.Audience,
    })) as Category[];
}

export default async function HomePage() {
    const [masterCategories, clientCategories] = await Promise.all([
        getCategories("master"),
        getCategories("client"),
    ]);

    return (
        <main className="page">
            <section className="card">
                <h1 className="h1">Приветствуем!</h1>
                <p className="lead">
                    Сарафан — это удобная, современная онлайн-платформа, которая объединяет
                    самые топовые услуги для всей семьи и их клиентов.
                </p>

                <RoleCategoryPicker
                    masterCategories={masterCategories}
                    clientCategories={clientCategories}
                />
            </section>
        </main>
    );
}

