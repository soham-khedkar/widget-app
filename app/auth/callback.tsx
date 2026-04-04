import { Colors } from '@/constants/theme'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { isLoggedIn, isLoading, profile, refreshProfile } = useAuthContext()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  useEffect(() => {
    // Handle OAuth callback with code exchange (PKCE flow)
    const handleOAuthCallback = async () => {
      // Check if we have a code in the URL (from OAuth redirect)
      const { code, error, error_description } = params
      
      if (error) {
        console.error('OAuth error:', error, error_description)
        router.replace(`/login?error=${encodeURIComponent(error_description || error)}`)
        return
      }

      if (code) {
        try {
          // Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Session exchange error:', exchangeError)
            router.replace(`/login?error=${encodeURIComponent(exchangeError.message)}`)
            return
          }

          if (data.session) {
            // Session created, wait for auth state to update
            // The auth provider will handle profile fetching
            await refreshProfile()
            // Navigation will happen via the auth state change below
          }
        } catch (err: any) {
          console.error('OAuth callback error:', err)
          router.replace(`/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`)
        }
      }
    }

    // Only handle code exchange if we have a code parameter
    if (params.code) {
      handleOAuthCallback()
    }
  }, [params, router, refreshProfile])

  useEffect(() => {
    // Wait for auth and profile to load
    if (isLoading) {
      return
    }

    if (isLoggedIn) {
      // User is logged in, check if they have a partner
      if (profile?.partner_id) {
        // User has a partner, go to tabs
        router.replace('/(tabs)')
      } else {
        // User doesn't have a partner, go to partner-setup
        router.replace('/partner-setup')
      }
    } else {
      // User is not logged in, go to login
      // Only redirect if we're not waiting for OAuth callback
      if (!params.code) {
        router.replace('/login')
      }
    }
  }, [isLoggedIn, isLoading, profile, router, params.code])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.text }]}>
          Confirming your account...
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
})

