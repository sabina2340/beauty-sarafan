const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function request(path, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!response.ok) {
    let message = 'Ошибка запроса'
    try {
      const payload = await response.json()
      message = payload.error || message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }
  return response.json()
}

export async function fetchCategories(signal) {
  return request('/categories', { signal })
}

export async function fetchMasters({ slug, city, q }, signal) {
  const params = new URLSearchParams()
  if (slug) params.set('slug', slug)
  if (city) params.set('city', city)
  if (q) params.set('q', q)

  const query = params.toString()
  const suffix = query ? `?${query}` : ''
  return request(`/masters${suffix}`, { signal })
}

export async function fetchMasterById(id, signal) {
  return request(`/masters/${id}`, { signal })
}

export async function fetchMasterAds(id, signal) {
  return request(`/masters/${id}/ads`, { signal })
}
