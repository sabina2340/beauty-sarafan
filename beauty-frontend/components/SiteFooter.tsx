import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="container footerWrap">
        <p>© {new Date().getFullYear()} Beauty Sarafan</p>

        <div className="footerAuthButtons">
          <Link href="/login" className="btn btnGhost footerBtn">
            Вход
          </Link>
          <Link href="/register" className="btn btnPrimary footerBtn">
            Регистрация
          </Link>
        </div>
      </div>
    </footer>
  );
}
