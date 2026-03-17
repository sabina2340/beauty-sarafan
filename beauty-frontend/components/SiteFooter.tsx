import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="container footerWrap">
        <p className="footerCopyright">© {new Date().getFullYear()} Сарафан</p>

        <p className="footerCompactLine">
          <Link href="/offer">Оферта</Link>
          <span> · </span>
          <Link href="/privacy">Политика</Link>
          <span> · </span>
          <Link href="/privacy">Персональные данные</Link>
        </p>

        <div className="footerLinks footerLinksDesktop">
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
