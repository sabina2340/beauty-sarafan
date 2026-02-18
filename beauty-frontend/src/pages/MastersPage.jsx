import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchCategories, fetchMasters } from '../api'
import { MasterCard } from '../components/MasterCard'

export function MastersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [masters, setMasters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const filters = useMemo(() => ({
    slug: searchParams.get('slug') || '',
    city: searchParams.get('city') || '',
    q: searchParams.get('q') || ''
  }), [searchParams])

  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch(() => setCategories([]))

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchMasters(filters, controller.signal)
      .then((data) => {
        setMasters(data)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [filters])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!value) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next)
  }

  const resetFilters = () => setSearchParams({})

  return (
    <section>
      <h1>Каталог мастеров</h1>

      <div className="filters">
        <label>
          Категория
          <select value={filters.slug} onChange={(e) => updateFilter('slug', e.target.value)}>
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </label>

        <label>
          Город
          <input
            value={filters.city}
            onChange={(e) => updateFilter('city', e.target.value)}
            placeholder="Например, Москва"
          />
        </label>

        <label>
          Поиск
          <input
            value={filters.q}
            onChange={(e) => updateFilter('q', e.target.value)}
            placeholder="Имя мастера"
          />
        </label>

        <button type="button" onClick={resetFilters}>Сбросить фильтры</button>
      </div>

      {loading && <p>Загрузка мастеров...</p>}
      {!loading && error && <p className="error">Ошибка: {error}</p>}

      {!loading && !error && masters.length === 0 && (
        <div className="empty-state">
          <p>По этим фильтрам ничего не найдено.</p>
          <button type="button" onClick={resetFilters}>Сбросить фильтры</button>
        </div>
      )}

      {!loading && !error && masters.length > 0 && (
        <div className="masters-grid">
          {masters.map((master) => <MasterCard key={master.user_id} master={master} />)}
        </div>
      )}
    </section>
  )
}
