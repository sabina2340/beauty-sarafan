import Link from "next/link";

export default function OfferPage() {
  return (
    <section className="card authCard legalPage">
      <h1 className="h1">Публичная оферта</h1>
      <p className="muted">Актуальная редакция условий использования сервиса.</p>
      <p><a className="btn btnGhost" href="/legal/offer.pdf" target="_blank" rel="noreferrer">Скачать PDF</a></p>
      <h3>Реквизиты</h3><p>Реквизиты размещены на отдельной странице.</p>
      <p><Link href="/requisites">Перейти к реквизитам</Link></p>
    </section>
  );
}
