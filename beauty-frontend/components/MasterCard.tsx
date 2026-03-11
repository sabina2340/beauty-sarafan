import { MasterCard as Master } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

type Props = {
  master: Master;
  backQuery: string;
};

export function MasterCard({ master, backQuery }: Props) {
  const to = `/masters/${master.user_id}${backQuery ? `?back=${encodeURIComponent(backQuery)}` : ""}`;

  return (
    <Card className="masterCard">
      {master.avatar_url ? <img src={master.avatar_url} alt={master.full_name || master.login} className="masterCardImage" /> : null}
      <h3 className="h3">{master.full_name || master.login}</h3>
      <p className="meta">{master.category_name || "Категория не указана"}</p>
      <p className="meta">{master.city || "Город не указан"} {master.verified ? "· Проверен" : ""}</p>
      <p className="desc">{master.short_description || master.description || "Описание пока не добавлено"}</p>
      <ButtonLink href={to} variant="secondary">Подробнее</ButtonLink>
    </Card>
  );
}
