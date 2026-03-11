import Link from "next/link";
import { MasterCard as Master } from "@/lib/types";

type Props = {
  master: Master;
  backQuery: string;
};

export function MasterCard({ master, backQuery }: Props) {
  const to = `/masters/${master.user_id}${backQuery ? `?back=${encodeURIComponent(backQuery)}` : ""}`;

  return (
    <article className="card masterCard">
      {master.avatar_url ? <img src={master.avatar_url} alt={master.full_name || master.login} className="masterCardImg" /> : null}
      <h3>{master.full_name || master.login}</h3>
      <p className="meta">{master.category_name || "Категория не указана"}</p>
      <p className="meta">{master.city || "Город не указан"} {master.verified ? "· Проверен" : ""}</p>
      <p className="desc">{master.short_description || master.description || "Описание пока не добавлено"}</p>
      <Link href={to} className="btn btnSecondary">
        Подробнее
      </Link>
    </article>
  );
}
