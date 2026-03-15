export default function PaymentInfoPage() {
  return (
    <section className="card authCard legalPage">
      <h1 className="h1">Информация об оплате</h1>
      <p><a className="btn btnGhost" href="/legal/payment.pdf" target="_blank" rel="noreferrer">Скачать PDF</a></p>
      <ul>
        <li>Оплата банковскими картами Visa, MasterCard, Мир.</li>
        <li>Платёж проходит через защищённый шлюз с поддержкой 3D Secure.</li>
        <li>Передача данных осуществляется по SSL/TLS.</li>
        <li>Сайт не хранит данные банковских карт.</li>
      </ul>
    </section>
  );
}
