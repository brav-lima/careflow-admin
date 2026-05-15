import axios, { AxiosError, AxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: '/api/admin',
  withCredentials: true,
})

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean }

const SESSIONS_PATH = '/auth/sessions'
const ME_PATH = '/auth/me'

let refreshInFlight: Promise<void> | null = null

const refreshSession = async () => {
  if (!refreshInFlight) {
    refreshInFlight = api.put(SESSIONS_PATH).then(
      () => undefined,
      (err) => {
        throw err
      },
    )
    refreshInFlight.finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

const isAuthEndpoint = (url: string) => url.includes(SESSIONS_PATH)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = original?.url ?? ''
    const onLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login'

    if (status === 401 && original && !original._retry && !isAuthEndpoint(url)) {
      original._retry = true
      try {
        await refreshSession()
        return api.request(original)
      } catch {
        if (!onLoginPage && !url.includes(ME_PATH)) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    if (status === 401 && !onLoginPage && !url.includes(ME_PATH) && !isAuthEndpoint(url)) {
      window.location.href = '/login'
    }

    if (!error.response) {
      const friendly = new Error('Sem conexão com o servidor. Verifique sua rede e tente novamente.')
      ;(friendly as Error & { isNetworkError?: boolean }).isNetworkError = true
      return Promise.reject(friendly)
    }

    return Promise.reject(error)
  },
)
