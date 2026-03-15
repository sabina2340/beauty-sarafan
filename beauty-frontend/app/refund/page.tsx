export default function RefundPage() {
  return (
    <section className="card authCard legalPage">
      <h1 className="h1">Условия возврата</h1>
      <p><a className="btn btnGhost" href="/legal/refund.pdf" target="_blank" rel="noreferrer">Скачать PDF</a></p>
      <ul>
        <li>Запрос на возврат направляется через поддержку с указанием номера платежа.</li>
        <li>Срок рассмотрения заявки — до 10 рабочих дней.</li>
        <li>Возврат производится на ту же карту, с которой была оплата.</li>
        <li>При частично оказанной услуге возможен частичный возврат.</li>
      </ul>
    </section>
  );
}
