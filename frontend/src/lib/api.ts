import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/admin',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? ''
      const isAuthCheck = url.includes('/auth/me')
      const onLoginPage = window.location.pathname === '/login'
      if (!isAuthCheck && !onLoginPage) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
