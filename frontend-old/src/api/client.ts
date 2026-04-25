const TOKEN_KEY = 'flatfinder_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Invalid response from server.')
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (!options.skipAuth) {
    const t = getToken()
    if (t) headers.set('Authorization', `Bearer ${t}`)
  }

  const res = await fetch(path, { ...options, headers })
  const data = await parseJson<{ error?: string } & T>(res).catch(() => ({} as T))

  if (!res.ok) {
    const msg =
      (data as { error?: string }).error ||
      (res.status === 401 ? 'Authentication failed.' : `Request failed (${res.status}).`)
    throw new Error(msg)
  }
  return data as T
}
