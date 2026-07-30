// Thin authenticated API helper — reads token from AuthContext is not possible here,
// so callers pass the token explicitly or we read from the supabase session storage.
// Usage: import { api } from '../lib/api'
//        api.get('/carbon-transactions', token)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const request = async (method, path, token, body = undefined) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const opts = { method, headers }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${API_BASE}${path}`, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  get:    (path, token)        => request('GET',    path, token),
  post:   (path, token, body)  => request('POST',   path, token, body),
  put:    (path, token, body)  => request('PUT',    path, token, body),
  delete: (path, token)        => request('DELETE', path, token),
}
