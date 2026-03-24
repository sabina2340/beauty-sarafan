import Link from "next/link";
import { MasterCard as Master } from "@/lib/types";

type Props = {
  master: Master;
  backQuery: string;
};

export function MasterCard({ master, backQuery }: Props) {
  const to = `/masters/${master.user_id}${backQuery ? `?back=${encodeURIComponent(backQuery)}` : ""}`;
  const hasAvatar = Boolean(master.avatar_url);
  const avatarSrc = master.avatar_url || "/logo-placeholder.png";

  return (
    <article className="card masterCard">
      <img
        src={avatarSrc}
        alt={master.full_name || master.login}
        className={`masterCardImg ${hasAvatar ? "" : "avatarFallback"}`}
        onError={(event) => {
          event.currentTarget.src = "/logo-placeholder.png";
          event.currentTarget.classList.add("avatarFallback");
        }}
      />
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
