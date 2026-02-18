import { Link, useLocation } from 'react-router-dom'

export function MasterCard({ master }) {
  const location = useLocation()

  return (
    <article className="master-card">
      <h3>{master.full_name || master.login}</h3>
      <p className="meta">{master.category_name || 'Без категории'} • {master.city || 'Город не указан'}</p>
      <p>{master.description || 'Описание пока не добавлено.'}</p>
      <Link
        className="primary-link"
        to={`/masters/${master.user_id}${location.search ? location.search : ''}`}
      >
        Подробнее
      </Link>
    </article>
  )
}
