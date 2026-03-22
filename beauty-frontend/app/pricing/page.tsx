import Link from "next/link";
import { getTariffs, type Tariff } from "@/lib/ads-api";

type NormalizedTariff = {
    id: number;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    isActive: boolean;
    sortOrder: number;
};

function normalizeTariff(tariff: Tariff): NormalizedTariff {
    return {
        id: Number((tariff as any).id ?? (tariff as any).ID ?? 0),
        name: String((tariff as any).name ?? (tariff as any).Name ?? ""),
        description: String((tariff as any).description ?? (tariff as any).Description ?? ""),
        price: Number((tariff as any).price ?? (tariff as any).Price ?? 0),
        durationDays: Number((tariff as any).duration_days ?? (tariff as any).DurationDays ?? 0),
        isActive: Boolean((tariff as any).is_active ?? (tariff as any).IsActive ?? false),
        sortOrder: Number((tariff as any).sort_order ?? (tariff as any).SortOrder ?? 0),
    };
}

function groupTitle(name: string) {
    const lower = name.toLowerCase();

    if (lower.includes("акции")) return "Сарафанные находки";
    if (lower.includes("всплыва")) return "Всплывающие окна";

    return "Другие тарифы";
}

export default async function PricingPage() {
    let tariffs: NormalizedTariff[] = [];
    let error = "";

    try {
        const data = await getTariffs();

        tariffs = (Array.isArray(data) ? data : [])
            .map(normalizeTariff)
            .filter((item) => item.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (e) {
        error = e instanceof Error ? e.message : "Не удалось загрузить тарифы";
    }

    const grouped = tariffs.reduce<Record<string, NormalizedTariff[]>>((acc, tariff) => {
        const key = groupTitle(tariff.name);
        if (!acc[key]) acc[key] = [];
        acc[key].push(tariff);
        return acc;
    }, {});

    return (
        <main className="mx-auto max-w-5xl px-4 py-10">
            <section className="card">
                <h1 className="h1">Тарифы и стоимость услуг</h1>

                <p className="muted" style={{ marginBottom: 16 }}>
                    Актуальная стоимость услуг размещения и продвижения объявлений, включая раздел «Сарафанные находки», указана в рублях.
                    Оплата производится через доступные на сайте способы оплаты.
                </p>

                {error ? (
                    <div className="noticeBox noticeDanger">
                        <p>{error}</p>
                    </div>
                ) : null}

                {!error && !tariffs.length ? (
                    <p className="muted">Активных тарифов пока нет.</p>
                ) : null}

                {Object.entries(grouped).map(([title, items]) => (
                    <section key={title} style={{ marginTop: 28 }}>
                        <h2 className="h2" style={{ marginBottom: 12 }}>
                            {title}
                        </h2>
                        {title === "Сарафанные находки" ? (
                            <p className="muted" style={{ marginBottom: 12 }}>
                                Проверенные акции
                            </p>
                        ) : null}

                        <div
                            style={{
                                display: "grid",
                                gap: 16,
                                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                            }}
                        >
                            {items.map((tariff) => (
                                <article
                                    key={tariff.id}
                                    className="adminItem"
                                    style={{
                                        borderRadius: 16,
                                        padding: 20,
                                    }}
                                >
                                    <strong style={{ display: "block", fontSize: 18, marginBottom: 10 }}>
                                        {tariff.name}
                                    </strong>

                                    <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>
                                        {tariff.price} ₽
                                    </p>

                                    <p className="muted" style={{ marginBottom: 10 }}>
                                        Срок размещения: {tariff.durationDays} дн.
                                    </p>

                                    {tariff.description ? (
                                        <p className="muted" style={{ marginBottom: 14 }}>
                                            {tariff.description}
                                        </p>
                                    ) : null}

                                    <Link className="btn btnPrimary" href="/account/ads">
                                        Перейти к объявлениям
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </section>
                ))}

                <section style={{ marginTop: 32 }}>
                    <h2 className="h2" style={{ marginBottom: 10 }}>
                        Важно
                    </h2>
                    <p className="muted">
                        Стоимость конкретной услуги определяется по действующему тарифу,
                        опубликованному на сайте на момент оформления.
                    </p>
                    <p className="muted">
                        Условия оплаты, возврата и обработки персональных данных доступны на
                        соответствующих страницах сайта.
                    </p>
                </section>
            </section>
        </main>
    );
}
