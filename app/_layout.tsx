import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { InteractionManager, Platform } from 'react-native'
import * as Linking from 'expo-linking'
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

  // Debug logging (remove in production)
  useEffect(() => {
    console.log('[RootNavigator] Auth state:', { isLoggedIn, isLoading, hasProfile: !!profile })
    console.log('[RootNavigator] Current segments:', segments)
  }, [isLoggedIn, isLoading, profile, segments])

  // Handle deep links from widgets
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!isLoggedIn) return

      try {
        const { hostname, path, queryParams } = Linking.parse(url)
        
        if (hostname === 'send-message' && queryParams?.templateId) {
          // Navigate to messages tab and send message
          router.push('/(tabs)/messages')
          // The messages screen will handle sending the message
        } else if (hostname === 'toggle-todo' && queryParams?.id) {
          // Navigate to todos tab
          router.push('/(tabs)/todos')
          // The todos screen will handle toggling
        } else if (hostname === 'sneak-peek') {
          router.push('/(tabs)/sneak-peek')
          // If photo ID is provided, open that specific photo
          if (queryParams?.id) {
            // The sneak peek screen will handle opening the photo detail
          }
        } else if (hostname === 'messages') {
          router.push('/(tabs)/messages')
        } else if (hostname === 'todos') {
          router.push('/(tabs)/todos')
        }
      } catch (error) {
        console.error('Error handling deep link:', error)
      }
    }

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url)
      }
    })

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url)
    })

    return () => {
      subscription.remove()
    }
  }, [isLoggedIn, router])

  useEffect(() => {
    // Don't navigate while initially loading
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

    // Navigate immediately when auth state changes
    if (isLoggedIn) {
      // User is logged in
      if (profile?.partner_id) {
        // User has a partner - should be on tabs
        if (isPartnerSetup || isLogin || !inTabsGroup) {
          // On partner-setup or login, or not on tabs, go to tabs
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
        if (isLogin || !isPartnerSetup) {
          // Coming from login or not on partner-setup, go to partner-setup
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

  // Show UI immediately, even while loading
  // This prevents blocking the app startup

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth callback must always be accessible for OAuth redirects */}
      <Stack.Screen name="auth/callback" />
      
      {/* Always render all screens - let navigation handle routing */}
      <Stack.Screen name="login" />
      <Stack.Screen name="partner-setup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" />
    </Stack>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  // Register widgets after React context is initialized (only on Android)
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Use InteractionManager to ensure this runs after all interactions are complete
      // This ensures React context is fully initialized
      const interaction = InteractionManager.runAfterInteractions(() => {
        try {
          // Dynamically import and call widget registration function
          const registerWidgets = require('@/widgets/widget-registration').default
          if (typeof registerWidgets === 'function') {
            registerWidgets()
          }
        } catch (error) {
          console.error('Failed to register widgets:', error)
          // Continue app startup even if widget registration fails
        }
      })

      return () => {
        interaction.cancel()
      }
    }
  }, [])

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