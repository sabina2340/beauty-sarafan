"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Category } from "./page";

type Props = {
    masterCategories: Category[];
    clientCategories: Category[];
};

type Role = "master" | "client";

export function RoleCategoryPicker({ masterCategories, clientCategories }: Props) {
    const [role, setRole] = useState<Role | null>(null);

    const categories = useMemo(() => {
        if (role === "master") return masterCategories;
        if (role === "client") return clientCategories;
        return [];
    }, [role, masterCategories, clientCategories]);

    return (
        <div className="picker">
            <h2 className="h2">Кто вы?</h2>

            <div className="roleButtons">
                <button
                    type="button"
                    className={`btn ${role === "master" ? "btnPrimary" : "btnGhost"}`}
                    onClick={() => setRole("master")}
                >
                    Вы предлагаете услуги?
                </button>

                <button
                    type="button"
                    className={`btn ${role === "client" ? "btnSecondary" : "btnGhost"}`}
                    onClick={() => setRole("client")}
                >
                    Вы ищете услугу?
                </button>
            </div>

            {role && (
                <div style={{ marginTop: 20 }}>
                    <h3 className="h3">
                        {role === "master" ? "Вы предлагаете услуги" : "Вы ищете услугу"}
                    </h3>

                    <p className="muted" style={{ marginTop: 6 }}>
                        Выберите категорию:
                    </p>

                    <div className="grid2" style={{ marginTop: 12 }}>
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/masters?slug=${encodeURIComponent(cat.slug)}`}
                                className="chip"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>

                    {categories.length === 0 && (
                        <p className="muted" style={{ marginTop: 10 }}>
                            Категорий пока нет.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
