export default function RequisitesPage() {
  return (
    <section className="card authCard legalPage">
      <h1 className="h1">Реквизиты</h1>
      <p><a className="btn btnGhost" href="/legal/requisites.pdf" target="_blank" rel="noreferrer">Скачать PDF</a></p>
      <div className="noticeBox">
        <p><strong>ФИО ИП:</strong> Иванов Иван Иванович</p>
        <p><strong>ИНН:</strong> 000000000000</p>
        <p><strong>Расчётный счёт:</strong> 40802810XXXXXXXXXXXX</p>
        <p><strong>Банк:</strong> ПАО «Банк»</p>
        <p><strong>БИК:</strong> 044525XXX</p>
        <p><strong>Корр. счёт:</strong> 30101810XXXXXXXXXXXX</p>
        <p><strong>ОГРНИП:</strong> 000000000000000</p>
        <p><strong>Адрес регистрации:</strong> Российская Федерация</p>
      </div>
      <p className="muted">Замените реквизиты на фактические перед публикацией.</p>
    </section>
  );
}
