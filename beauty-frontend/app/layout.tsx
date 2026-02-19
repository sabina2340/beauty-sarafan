import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beauty Sarafan — Найдите своего мастера',
  description: 'Платформа для поиска бьюти-мастеров по категории и городу.',
  openGraph: {
    title: 'Beauty Sarafan',
    description: 'Публичный каталог мастеров красоты.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <nav className="container nav" aria-label="Главная навигация">
            <Link href="/" className="logo">
              Beauty Sarafan
            </Link>
            <div className="nav-links">
              <Link href="/">Главная</Link>
              <Link href="/masters">Каталог мастеров</Link>
            </div>
          </nav>
        </header>

        <main className="container">{children}</main>

        <footer className="site-footer">
          <div className="container">© {new Date().getFullYear()} Beauty Sarafan</div>
        </footer>
      </body>
    </html>
  );
}
