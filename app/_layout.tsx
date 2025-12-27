import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import 'react-native-reanimated'
import Toast from 'react-native-toast-message'

import { SplashScreenController } from '@/components/splash-screen-controller'

import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import AuthProvider from '@/providers/auth-provider'

// Separate RootNavigator so we can access the AuthContext
function RootNavigator() {
  const { isLoggedIn, isLoading, profile } = useAuthContext()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) {
      return
    }

    const inTabsGroup = segments[0] === '(tabs)'
    const isPartnerSetup = segments[0] === 'partner-setup'
    const isLogin = segments[0] === 'login'
    const isCallback = segments[0] === 'auth' && segments[1] === 'callback'
    const isModal = segments[0] === 'modal'

    // Don't redirect if we're on callback or modal screens
    if (isCallback || isModal) {
      return
    }

    if (isLoggedIn) {
      // User is logged in
      if (profile?.partner_id) {
        // User has a partner - should be on tabs
        if (isPartnerSetup) {
          // On partner-setup but has partner, go to tabs
          router.replace('/(tabs)')
        } else if (!inTabsGroup) {
          // Not on tabs, go to tabs
          router.replace('/(tabs)')
        }
      } else {
        // User doesn't have a partner
        // IMPORTANT: If user is already on tabs (they clicked skip), let them stay
        // Only redirect to partner-setup if they're on a different screen
        if (inTabsGroup) {
          // User is on tabs without a partner - they skipped, let them stay
          return
        }
        if (!isPartnerSetup) {
          // Not on partner-setup or tabs, go to partner-setup
          router.replace('/partner-setup')
        }
      }
    } else {
      // User is not logged in
      if (!isLogin && !isCallback) {
        router.replace('/login')
      }
    }
  }, [isLoggedIn, isLoading, profile, segments, router])

  // Show nothing while loading (session or profile)
  if (isLoading) {
    return null
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth callback must always be accessible for OAuth redirects */}
      <Stack.Screen name="auth/callback" />
      
      {isLoggedIn ? (
        <>
          {/* Always include all authenticated screens */}
          <Stack.Screen name="partner-setup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" />
        </>
      ) : (
        <Stack.Screen name="login" />
      )}
    </Stack>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SplashScreenController />
        <RootNavigator />
        <StatusBar style="auto" />
        <Toast visibilityTime={2000} />
      </AuthProvider>
    </ThemeProvider>
  )
}