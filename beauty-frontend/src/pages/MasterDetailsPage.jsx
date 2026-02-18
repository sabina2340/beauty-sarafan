import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchMasterAds, fetchMasterById } from '../api'

export function MasterDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [master, setMaster] = useState(null)
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    Promise.all([
      fetchMasterById(id, controller.signal),
      fetchMasterAds(id, controller.signal).catch(() => [])
    ])
      .then(([masterInfo, adsInfo]) => {
        setMaster(masterInfo)
        setAds(adsInfo)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [id])

  if (loading) return <p>Загрузка карточки мастера...</p>
  if (error) return <p className="error">Ошибка: {error}</p>
  if (!master) return <p>Мастер не найден.</p>

  return (
    <section>
      <button type="button" className="secondary-button" onClick={() => navigate(-1)}>
        ← Назад
      </button>

      <h1>{master.full_name || master.login}</h1>
      <p className="meta">{master.category_name || 'Без категории'} • {master.city || 'Город не указан'}</p>

      <div className="details-grid">
        <article>
          <h2>Описание</h2>
          <p>{master.description || 'Описание отсутствует.'}</p>
        </article>

        <article>
          <h2>Услуги</h2>
          <p>{master.services || 'Услуги не указаны.'}</p>
        </article>

        <article>
          <h2>Контакты</h2>
          <ul>
            <li>Телефон: {master.phone || 'Не указан'}</li>
            <li>Соцсети: {master.social_links || 'Не указаны'}</li>
            <li>Логин: {master.login}</li>
          </ul>
        </article>
      </div>

      {ads.length > 0 && (
        <section>
          <h2>Объявления мастера</h2>
          <ul className="ads-list">
            {ads.map((ad) => (
              <li key={ad.id}>
                <h3>{ad.title}</h3>
                <p>{ad.description || 'Без описания'}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link to="/masters" className="primary-link">Вернуться в каталог</Link>
    </section>
  )
}
