const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5080'

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message ?? 'אירעה שגיאה')
    this.status = status
    this.body = body
  }
}

// כל קריאה לשרת עוברת כאן. ה-JWT נשלח ב-header Authorization
export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}
