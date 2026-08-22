// Servicios de autenticación.

import axios from 'axios'
import api from './api'
import type { User } from '../types'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams({ username, password })
  const { data } = await api.post<LoginResponse>('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

// Fire-and-forget con axios pelado: no debe pasar por los interceptores
// (un 401 aquí no debe intentar refrescar ni redirigir).
export function logoutRequest(): void {
  void axios
    .post(`${api.defaults.baseURL}/auth/logout`, {}, { withCredentials: true })
    .catch(() => {})
}
