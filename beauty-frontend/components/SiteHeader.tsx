import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="siteHeader">
      <div className="container navWrap">
        <Link href="/" className="brand" aria-label="Beauty Sarafan home">
          Beauty Sarafan
        </Link>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/">Главная</Link>
          <Link href="/masters">Мастера</Link>
          <Link href="/admin">Админ</Link>
        </nav>
      </div>
    </header>
  );
}
