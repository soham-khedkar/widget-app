import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'
import { GrainyBackground } from '@/components/grainy-background'
import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'

export default function PartnerSetupScreen() {
  const { profile, isLoading, refreshProfile } = useAuthContext()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  
  const [partnerCode, setPartnerCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Wait for profile to load
    if (isLoading) {
      return
    }

    // Check if user already has a partner
    if (profile?.partner_id) {
      // User already has a partner, go to main app
      router.replace('/(tabs)')
    } else {
      setChecking(false)
    }
  }, [profile, isLoading, router])

  const handleConnectPartner = async () => {
    if (!partnerCode.trim()) {
      Alert.alert('Error', 'Please enter a partner code')
      return
    }

    const code = partnerCode.trim().toUpperCase()
    setLoading(true)

    try {
      // Find profile with this partner code
      const { data: partnerProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('partner_code', code)
        .single()

      if (findError || !partnerProfile) {
        Alert.alert('Error', 'Invalid partner code. Please check and try again.')
        setLoading(false)
        return
      }

      // Prevent connecting to yourself
      if (partnerProfile.id === profile?.id) {
        Alert.alert('Error', 'You cannot connect to yourself!')
        setLoading(false)
        return
      }

      // Update current user's partner_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ partner_id: partnerProfile.id })
        .eq('id', profile?.id)

      if (updateError) {
        throw updateError
      }

      // Update partner's partner_id to current user
      const { error: partnerUpdateError } = await supabase
        .from('profiles')
        .update({ partner_id: profile?.id })
        .eq('id', partnerProfile.id)

      if (partnerUpdateError) {
        // Still successful for current user, but log the error
        console.error('Error updating partner:', partnerUpdateError)
      }

      await refreshProfile()
      Alert.alert('Success', `Connected with ${partnerProfile.name || partnerProfile.email}!`)
      router.replace('/(tabs)')
    } catch (error: any) {
      console.error('Error connecting partner:', error)
      Alert.alert('Error', error.message || 'Failed to connect partner. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    // User can skip and connect later
    router.replace('/(tabs)')
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <GrainyBackground>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
          </View>
        </GrainyBackground>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <GrainyBackground>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { borderColor: colors.border, borderWidth: 2 }]}>
              <Ionicons name="people" size={48} color={colors.primary} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.primary }]}>Connect with Your Partner</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your partner's code to connect, or skip this step for now
            </Text>

            {/* Partner Code Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Partner Code</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 2,
                    color: colors.primary,
                  },
                ]}
                placeholder="Enter 6-digit code"
                placeholderTextColor={colors.textSecondary}
                value={partnerCode}
                onChangeText={(text) => setPartnerCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />
            </View>

            {/* Your Code Display */}
            {profile?.partner_code && (
              <View style={[styles.codeDisplay, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Your Partner Code</Text>
                <Text style={[styles.codeValue, { color: colors.primary }]}>{profile.partner_code}</Text>
                <Text style={[styles.codeHint, { color: colors.textSecondary }]}>
                  Share this code with your partner to connect
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.connectButton, { backgroundColor: colors.primary }]}
                onPress={handleConnectPartner}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={[styles.connectButtonText, { color: colors.background }]}>Connect</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.skipButton, { borderColor: colors.border, borderWidth: 2 }]}
                onPress={handleSkip}
                disabled={loading}
              >
                <Text style={[styles.skipButtonText, { color: colors.primary }]}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </GrainyBackground>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  codeDisplay: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 8,
  },
  codeHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  connectButton: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 2,
    }),
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
})





