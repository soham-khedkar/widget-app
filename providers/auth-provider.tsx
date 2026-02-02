import { AuthContext } from '@/hooks/use-auth-context'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import { PropsWithChildren, useEffect, useState } from 'react'

// Complete the auth session for better UX
WebBrowser.maybeCompleteAuthSession()

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | undefined | null>()
  const [profile, setProfile] = useState<any>()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false)

  // Fetch profile function
  const fetchProfile = async (userId: string) => {
    setIsProfileLoading(true)
    try {
      // First try to fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // If profile doesn't exist, try to create it
      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: session?.user.email || '',
            name: session?.user.user_metadata?.name || session?.user.email?.split('@')[0] || 'User',
          })
          .select()
          .single()
        
        if (createError) {
          // Only log non-network errors
          if (!createError.message?.includes('Network request failed') && !createError.message?.includes('fetch')) {
            console.error('Error creating profile:', createError)
          }
          setProfile(null)
        } else {
          setProfile(newProfile)
        }
      } else if (error) {
        // Only log non-network errors
        if (!error.message?.includes('Network request failed') && !error.message?.includes('fetch')) {
          console.error('Error fetching profile:', error)
        }
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err: any) {
      // Handle network errors gracefully
      if (!err?.message?.includes('Network request failed') && !err?.message?.includes('fetch')) {
        console.error('Unexpected error fetching profile:', err)
      }
      setProfile(null)
    } finally {
      setIsProfileLoading(false)
    }
  }

  // Fetch the session once, and subscribe to auth state changes
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)
      setIsProfileLoading(true)

      // If Supabase is not configured, skip initialization
      if (!isSupabaseConfigured) {
        setIsLoading(false)
        setIsProfileLoading(false)
        setSession(null)
        setProfile(null)
        return
      }

      try {
        // Set session immediately to unblock UI, then fetch profile in background
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          // Only log non-network errors to avoid spam
          if (!error.message?.includes('Network request failed') && !error.message?.includes('fetch')) {
            console.error('Error fetching session:', error)
          }
        }

        setSession(session)
        
        // Mark loading as false immediately to unblock UI
        setIsLoading(false)
        
        // Fetch profile in background (non-blocking)
        if (session?.user?.id) {
          // Don't await - let it happen in background
          fetchProfile(session.user.id).catch((err) => {
            // Only log non-network errors
            if (!err?.message?.includes('Network request failed') && !err?.message?.includes('fetch')) {
              console.error('Error fetching profile:', err)
            }
          })
        } else {
          setProfile(null)
          setIsProfileLoading(false)
        }
      } catch (error: any) {
        // Handle any unexpected errors
        if (!error?.message?.includes('Network request failed') && !error?.message?.includes('fetch')) {
          console.error('Unexpected error initializing auth:', error)
        }
        setIsLoading(false)
        setIsProfileLoading(false)
        setSession(null)
        setProfile(null)
      }
    }

    initializeAuth()

    // Only subscribe to auth changes if Supabase is configured
    if (!isSupabaseConfigured) {
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      
      // Fetch profile when session changes
      if (session?.user?.id) {
        try {
          await fetchProfile(session.user.id)
        } catch (err: any) {
          // Only log non-network errors
          if (!err?.message?.includes('Network request failed') && !err?.message?.includes('fetch')) {
            console.error('Error fetching profile on auth change:', err)
          }
        }
      } else {
        setProfile(null)
        setIsProfileLoading(false)
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // If sign in successful, fetch profile
    if (data?.session?.user?.id && !error) {
      await fetchProfile(data.session.user.id)
    }
    
    return { data, error }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Use the scheme directly - Supabase will append /auth/callback
      const redirectUrl = 'truluv://auth/callback'

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name?.trim() || email.split('@')[0],
          },
        },
      })
      
      if (error) {
        console.error('Sign up error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
        })
        return { data: null, error }
      }

      // If signup successful but no session (email confirmation required)
      if (data?.user && !data.session) {
        // Profile will be created by trigger when user confirms email
        // But let's also try to create it now in case email confirmation is disabled
        if (data.user.id) {
          // Try to fetch profile after a short delay to allow trigger to run
          setTimeout(async () => {
            await fetchProfile(data.user.id)
          }, 1000)
        }
      } else if (data?.session) {
        // Session exists, profile should be created by trigger
        setSession(data.session)
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('Sign up exception:', error)
      return { 
        data: null, 
        error: { 
          message: error.message || 'An unexpected error occurred during sign up',
          name: error.name || 'SignUpError'
        } 
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
    setSession(null)
        setProfile(null)
    return { error }
  }

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id)
    }
  }

  const resendConfirmationEmail = async (email: string) => {
    const redirectUrl = 'truluv://auth/callback'

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    return { data, error }
  }

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = 'truluv://auth/callback'
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        console.error('Google OAuth error:', error)
        throw error
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        )

        if (result.type === 'cancel') {
          return { data: null, error: { message: 'Sign in cancelled' } }
        }

        if (result.type === 'success' && result.url) {
          // Extract tokens from the callback URL
          const hashMatch = result.url.match(/#(.+)/)
          if (hashMatch) {
            const hashParams = new URLSearchParams(hashMatch[1])
            const access_token = hashParams.get('access_token')
            const refresh_token = hashParams.get('refresh_token')

            if (access_token && refresh_token) {
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              })

              if (sessionError) {
                return { data: null, error: sessionError }
              }

              // Manually update session state (auth state listener should also fire, but ensure it updates)
              if (sessionData.session) {
                setSession(sessionData.session)
                
                // Fetch profile after a brief delay to allow trigger to run
                setTimeout(async () => {
                  await fetchProfile(sessionData.session.user.id)
                }, 500)
              }
            }
          }
        }
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      return { data: null, error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading: isLoading || isProfileLoading,
        profile,
        isLoggedIn: !!session,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resendConfirmationEmail,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}