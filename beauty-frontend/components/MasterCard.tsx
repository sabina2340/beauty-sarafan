import Link from "next/link";
import { MasterCard as Master } from "@/lib/types";

type Props = {
  master: Master;
  backQuery: string;
};

export function MasterCard({ master, backQuery }: Props) {
  const to = `/masters/${master.user_id}${backQuery ? `?back=${encodeURIComponent(backQuery)}` : ""}`;

  return (
    <article className="card">
      <h3>{master.full_name || master.login}</h3>
      <p className="meta">{master.category_name || "Категория не указана"}</p>
      <p className="meta">{master.city || "Город не указан"}</p>
      <p className="desc">{master.description || "Описание пока не добавлено"}</p>
      <Link href={to} className="btnSecondary">
        Подробнее
      </Link>
    </article>
  );
}
