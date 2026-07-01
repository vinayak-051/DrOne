import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let _token = null
let _tokenExp = 0

supabase.auth.onAuthStateChange(() => {
  _token = null
  _tokenExp = 0
})

async function getToken() {
  const now = Date.now() / 1000
  if (_token && _tokenExp > now + 60) return _token
  const { data: { session } } = await supabase.auth.getSession()
  _token = session?.access_token ?? null
  if (_token) {
    try {
      const payload = JSON.parse(atob(_token.split('.')[1]))
      _tokenExp = payload.exp ?? 0
    } catch {
      _tokenExp = 0
    }
  }
  return _token
}

async function request(method, path, body = null, isFormData = false) {
  const token = await getToken()
  const headers = { Authorization: `Bearer ${token}` }
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  if (res.status === 401) {
    _token = null
    _tokenExp = 0
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        _token = session.access_token
        try {
          const payload = JSON.parse(atob(_token.split('.')[1]))
          _tokenExp = payload.exp ?? 0
        } catch { _tokenExp = 0 }

        const retryHeaders = { Authorization: `Bearer ${_token}` }
        if (!isFormData) retryHeaders['Content-Type'] = 'application/json'
        const retry = await fetch(`${BASE_URL}${path}`, {
          method,
          headers: retryHeaders,
          body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        })
        if (!retry.ok) {
          const err = await retry.json().catch(() => ({ detail: retry.statusText }))
          throw new Error(err.detail || 'Request failed')
        }
        return retry.json()
      }
    } catch {
      // session fetch failed — fall through to error
    }
    throw new Error('Session expired, please log in again')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
  postForm: (path, formData) => request('POST', path, formData, true),
  _getToken: getToken,
}
