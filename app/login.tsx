import { Colors } from '@/constants/theme'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({})
  
  const { signIn, signUp, signInWithGoogle } = useAuthContext()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): boolean => {
    // At least 6 characters
    return password.length >= 6
  }

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; name?: string } = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (isSignUp && !validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (isSignUp && !name.trim()) {
      newErrors.name = 'Name is required'
    } else if (isSignUp && name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getErrorMessage = (error: any): string => {
    const message = error?.message || error?.error_description || 'An error occurred'
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists') || lowerMessage.includes('user already registered')) {
      return 'This email is already registered. Please sign in instead.'
    }
    if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid credentials')) {
      return 'Invalid email or password. Please try again.'
    }
    if (lowerMessage.includes('email not confirmed') || lowerMessage.includes('email_not_confirmed')) {
      return 'Please check your email to confirm your account before signing in.'
    }
    if (lowerMessage.includes('unable to add users') || lowerMessage.includes('database') || lowerMessage.includes('authapi')) {
      return 'Unable to create account. Please check your database setup or try again later.'
    }
    if (lowerMessage.includes('password')) {
      return 'Password must be at least 6 characters long.'
    }
    if (lowerMessage.includes('email')) {
      return 'Please enter a valid email address.'
    }
    return message
  }

  const handleEmailAuth = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        const result = await signUp(email.trim(), password, name.trim())
        if (result.error) {
          Alert.alert('Sign Up Failed', getErrorMessage(result.error))
        } else {
          if (result.data?.user && !result.data.session) {
            Alert.alert(
              'Account Created!',
              'Please check your email to confirm your account.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setIsSignUp(false)
                    setEmail('')
                    setPassword('')
                    setName('')
                    setErrors({})
                  },
                },
              ]
            )
          } else {
            Alert.alert(
              'Success!',
              'Account created successfully!',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setIsSignUp(false)
                    setEmail('')
                    setPassword('')
                    setName('')
                    setErrors({})
                  },
                },
              ]
            )
          }
        }
      } else {
        const result = await signIn(email.trim(), password)
        if (result.error) {
          Alert.alert('Sign In Failed', getErrorMessage(result.error))
        }
        // Navigation happens automatically via auth state change
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result.error) {
        setLoading(false)
        Alert.alert('Google Sign In Failed', result.error.message || 'Please try again')
      } else {
        // OAuth flow completed - session is set, auth state will update
        setLoading(false)
      }
    } catch (error: any) {
      setLoading(false)
      Alert.alert('Error', error.message || 'Something went wrong')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSignUp
              ? 'Start your journey together'
              : 'Sign in to continue'}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        color: colors.text, 
                        borderColor: errors.name ? colors.error : colors.border,
                        backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                      }
                    ]}
                    placeholder="Full Name"
                    placeholderTextColor={colorScheme === 'dark' ? '#9BA1A6' : '#687076'}
                    value={name}
                    onChangeText={(text) => {
                      setName(text)
                      if (errors.name) {
                        setErrors({ ...errors, name: undefined })
                      }
                    }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.name && (
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>
                )}
              </View>
            )}

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { 
                      color: colors.text, 
                      borderColor: errors.email ? colors.error : colors.border,
                      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                    }
                  ]}
                  placeholder="Email"
                  placeholderTextColor={colorScheme === 'dark' ? '#9BA1A6' : '#687076'}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined })
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { 
                      color: colors.text, 
                      borderColor: errors.password ? colors.error : colors.border,
                      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                    }
                  ]}
                  placeholder="Password"
                  placeholderTextColor={colorScheme === 'dark' ? '#9BA1A6' : '#687076'}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined })
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
              )}
            </View>

            {/* Primary Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleGoogleAuth}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color={colors.text} />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Toggle Sign Up/Sign In */}
            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp)
                  setErrors({}) // Clear errors when switching
                  setEmail('')
                  setPassword('')
                  setName('')
                }}
              >
                <Text style={[styles.toggleLink, { color: colors.primary }]}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
          </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 140,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 20, // Softer rounded corners
    paddingHorizontal: 48,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // More transparent for grainy effect
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28, // Rounded full style
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    // Soft iOS-only shadow
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 2,
    }),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
  },
})
