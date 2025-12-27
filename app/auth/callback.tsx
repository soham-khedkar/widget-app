import { Colors } from '@/constants/theme'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AuthCallback() {
  const router = useRouter()
  const { isLoggedIn, isLoading, profile } = useAuthContext()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

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
      router.replace('/login')
    }
  }, [isLoggedIn, isLoading, profile, router])

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

