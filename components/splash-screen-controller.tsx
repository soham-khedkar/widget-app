import { useAuthContext } from '@/hooks/use-auth-context'
import { SplashScreen } from 'expo-router'
import { useEffect } from 'react'

SplashScreen.preventAutoHideAsync()

export function SplashScreenController() {
  const { isLoading } = useAuthContext()

  useEffect(() => {
    // Hide splash screen immediately to unblock UI
    // Don't wait for auth - let UI render first
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors if splash screen is already hidden
      })
    }, 500) // Hide after 500ms max
    
    return () => clearTimeout(timer)
  }, []) // Run once on mount, don't wait for isLoading

  return null
}