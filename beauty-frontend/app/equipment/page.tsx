import { getEquipmentCatalog } from "@/lib/equipment-api";

export default async function EquipmentPage() {
  const items = await getEquipmentCatalog().catch(() => []);

  return (
    <section className="equipmentPage">
      <h1 className="h1">Каталог оборудования</h1>
      <p className="muted">Оборудование для специалистов. Для деталей свяжитесь по контактам в карточке.</p>

      <div className="grid equipmentGrid">
        {items.map((item) => (
          <article key={item.id} className="card equipmentCard">
            {item.image_url ? <img className="equipmentImg" src={item.image_url} alt={item.name || "Оборудование"} /> : null}
            <h2 className="h3">{item.name || "Оборудование"}</h2>
            <p>{item.description || "Описание отсутствует"}</p>
            <p className="meta"><strong>Контакт:</strong> {item.contact || "не указан"}</p>
          </article>
        ))}
      </div>

      {items.length === 0 ? <p className="muted">Пока в каталоге нет оборудования.</p> : null}
    </section>
  );
}
