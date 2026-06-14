import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, AuthUser, LoginDto, AuthTokens } from '@/types'
import { api } from '@/lib/api-client'
import { socketManager } from '@/lib/socket'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials: LoginDto) => {
        set({ isLoading: true })
        try {
          // Backend returns: { accessToken, refreshToken, role, userId }
          const response = await api.post<{
            accessToken: string
            refreshToken: string
            role: string
            userId: string
          }>('/auth/login', credentials)

          const tokens: AuthTokens = {
            accessToken:  response.accessToken,
            refreshToken: response.refreshToken,
          }

          const user: AuthUser = {
            id:          response.userId,
            email:       credentials.email,
            role:        response.role as any,
            isActive:    true,
            createdAt:   new Date().toISOString() as any,
            updatedAt:   new Date().toISOString() as any,
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token',  tokens.accessToken)
            localStorage.setItem('refresh_token', tokens.refreshToken)
          }

          set({ user, tokens, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
        socketManager.disconnect()
        set({ user: null, tokens: null, isAuthenticated: false })
      },

      refreshTokens: async () => {
        const { tokens } = get()
        if (!tokens?.refreshToken) return

        try {
          const response = await api.post<{
            accessToken: string
            refreshToken: string
          }>('/auth/refresh', { refreshToken: tokens.refreshToken })

          const newTokens: AuthTokens = {
            accessToken:  response.accessToken,
            refreshToken: response.refreshToken,
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token',  newTokens.accessToken)
            localStorage.setItem('refresh_token', newTokens.refreshToken)
          }

          set({ tokens: newTokens })
        } catch {
          get().logout()
        }
      },

      setUser: (user: AuthUser) => set({ user }),
    }),
    {
      name: 'red-talento-auth',
      partialize: (state) => ({
        user:            state.user,
        tokens:          state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
