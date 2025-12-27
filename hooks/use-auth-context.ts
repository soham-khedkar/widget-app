import { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type AuthData = {
  session?: Session | null
  profile?: any | null
  isLoading: boolean
  isLoggedIn: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string, name?: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ data: any; error: any }>
  resendConfirmationEmail: (email: string) => Promise<{ data: any; error: any }>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthData>({
  session: undefined,
  profile: undefined,
  isLoading: true,
  isLoggedIn: false,
  signIn: async () => ({ data: null, error: new Error('Not implemented') }),
  signUp: async () => ({ data: null, error: new Error('Not implemented') }),
  signOut: async () => ({ error: null }),
  signInWithGoogle: async () => ({ data: null, error: new Error('Not implemented') }),
  resendConfirmationEmail: async () => ({ data: null, error: new Error('Not implemented') }),
  refreshProfile: async () => {},
})

export const useAuthContext = () => useContext(AuthContext)