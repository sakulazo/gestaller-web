// Cliente HTTP centralizado con manejo de JWT y errores de aplicación.

import axios from 'axios'
import { emitToast } from '../components/Toast'
import { toApplicationError } from '../types/errors'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  // Necesario para que viaje la cookie httpOnly del refresh token.
  withCredentials: true,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(undefined)
    }
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gestaller_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const appErr = toApplicationError(error)

    // 401 → intentar refresh una vez
    if (appErr.code === 'AUTHENTICATION_REQUIRED' && !originalRequest._retry) {
      const token = localStorage.getItem('gestaller_token')
      if (!token) {
        localStorage.removeItem('gestaller_user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Sin header Authorization: el refresh viaja por cookie httpOnly.
        // axios "pelado" para no re-disparar este interceptor en cascada.
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        localStorage.setItem('gestaller_token', data.access_token)
        processQueue(null)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        localStorage.removeItem('gestaller_token')
        localStorage.removeItem('gestaller_user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Errores de campo (VALIDATION_ERROR con fields, o CONFLICT con deleted_id)
    if (
      (appErr.code === 'VALIDATION_ERROR' && appErr.fields) ||
      (appErr.code === 'CONFLICT' && appErr.deleted_id)
    ) {
      return Promise.reject(error)
    }

    // Resto de errores en mutations → toast
    const method = error.config?.method?.toUpperCase() ?? 'GET'
    if (method !== 'GET') {
      emitToast('error', appErr.message)
    }

    return Promise.reject(error)
  },
)

export default api
