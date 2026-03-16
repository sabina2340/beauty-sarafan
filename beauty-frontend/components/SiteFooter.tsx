import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="container footerWrap">
        <p>© {new Date().getFullYear()} Сарафан</p>
        <div className="footerLinks">
          <Link href="/offer">Оферта</Link>
          <Link href="/payment">Оплата</Link>
          <Link href="/refund">Возврат</Link>
          <Link href="/privacy">Конфиденциальность</Link>
          <Link href="/pricing">Тарифы</Link>
        </div>
      </div>
    </footer>
  );
}
