import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="hero">
      <h1>Найдите мастера красоты рядом с вами</h1>
      <p>
        Публичный каталог Beauty Sarafan — быстрый поиск по категории, городу и имени мастера.
      </p>
      <Link className="cta-button" to="/masters">
        Найти мастера
      </Link>
    </section>
  )
}
