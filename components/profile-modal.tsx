import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

interface ProfileModalProps {
  visible: boolean
  onClose: () => void
}

interface FormErrors {
  name?: string
  age?: string
  address?: string
}

// Validation functions
const validateName = (name: string): string | undefined => {
  if (!name.trim()) {
    return 'Name is required'
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters'
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes'
  }
  return undefined
}

const validateAge = (age: string): string | undefined => {
  if (!age.trim()) {
    return 'Age is required'
  }
  const ageNum = parseInt(age, 10)
  if (isNaN(ageNum)) {
    return 'Age must be a number'
  }
  if (ageNum < 13 || ageNum > 120) {
    return 'Age must be between 13 and 120'
  }
  return undefined
}

const validateAddress = (address: string): string | undefined => {
  if (!address.trim()) {
    return 'Address is required'
  }
  if (address.trim().length < 5) {
    return 'Address must be at least 5 characters'
  }
  // Basic address validation - allows letters, numbers, spaces, commas, periods, hyphens
  if (!/^[a-zA-Z0-9\s,.'-]+$/.test(address.trim())) {
    return 'Address contains invalid characters'
  }
  return undefined
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { profile, refreshProfile, signOut } = useAuthContext()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [relationshipStartDate, setRelationshipStartDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('[ProfileModal] visible changed:', visible)
  }, [visible])

  const handleBackdropPress = () => {
    console.log('[ProfileModal] backdrop pressed, closing modal')
    onClose()
  }

  // Load profile data when modal opens
  useEffect(() => {
    if (visible) {
      if (profile) {
        setName(profile.name || '')
        setGender((profile.gender as 'male' | 'female' | 'other') || '')
        setAge(profile.age ? String(profile.age) : '')
        setAddress(profile.address || '')
        // Load relationship start date if exists
        if (profile.relationship_start_date) {
          setRelationshipStartDate(new Date(profile.relationship_start_date))
        } else {
          setRelationshipStartDate(null)
        }
      } else {
        // Reset if no profile
        setName('')
        setGender('')
        setAge('')
        setAddress('')
        setRelationshipStartDate(null)
      }
      setErrors({})
    }
  }, [visible, profile])

  const handleSave = async () => {
    // Validate all fields
    const nameError = validateName(name)
    const ageError = age.trim() ? validateAge(age) : undefined
    const addressError = address.trim() ? validateAddress(address) : undefined

    if (nameError || ageError || addressError) {
      setErrors({
        name: nameError,
        age: ageError,
        address: addressError,
      })
      return
    }

    setLoading(true)
    try {
      // Build update object - only include fields that exist in database
      const updateData: any = {
        name: name.trim(),
        updated_at: new Date().toISOString(),
      }

      // Add optional fields if they exist in the database schema
      // Note: These columns need to be added to the profiles table if they don't exist
      // ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
      // ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
      // ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
      
      if (gender) {
        updateData.gender = gender
      }
      if (age.trim()) {
        updateData.age = parseInt(age, 10)
      }
      if (address.trim()) {
        updateData.address = address.trim()
      }
      
      // Add relationship start date if set
      if (relationshipStartDate) {
        updateData.relationship_start_date = relationshipStartDate.toISOString().split('T')[0]
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile?.id)

      if (error) throw error

      await refreshProfile()
      Alert.alert('Success', 'Profile updated successfully!')
      onClose()
    } catch (error: any) {
      console.error('Profile update error:', error)
      Alert.alert('Error', error.message || 'Failed to update profile. Make sure gender, age, and address columns exist in the profiles table.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut()
            onClose()
          },
        },
      ]
    )
  }

  console.log('[ProfileModal] Rendering, visible:', visible)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        console.log('[ProfileModal] onRequestClose called')
        onClose()
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
            <TouchableOpacity
              onPress={() => {
                console.log('[ProfileModal] Close button pressed')
                onClose()
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.scrollContainer}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
            {/* Profile Info Display */}
            {profile && (
              <>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.profileInfoValue, { color: colors.text }]}>{profile.email || 'N/A'}</Text>
                </View>
                
                {/* Partner Code */}
                {profile.partner_code && (
                  <View style={[styles.partnerCodeContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                    <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Your Partner Code</Text>
                    <Text style={[styles.partnerCodeValue, { color: colors.primary }]}>{profile.partner_code}</Text>
                    <Text style={[styles.partnerCodeHint, { color: colors.textSecondary }]}>
                      Share this code with your partner to connect
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: errors.name ? colors.error : colors.border,
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={(text) => {
                  setName(text)
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined })
                  }
                }}
                autoCapitalize="words"
              />
              {errors.name && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Gender - Optional */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Gender (Optional)</Text>
              <View style={styles.genderContainer}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      {
                        backgroundColor:
                          gender === g ? colors.primary : 'transparent',
                        borderColor: gender === g ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        {
                          color: gender === g ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Age - Optional */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Age (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: errors.age ? colors.error : colors.border,
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  },
                ]}
                placeholder="Enter your age"
                placeholderTextColor={colors.textSecondary}
                value={age}
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericText = text.replace(/[^0-9]/g, '')
                  setAge(numericText)
                  if (errors.age) {
                    setErrors({ ...errors, age: undefined })
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
              />
              {errors.age && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.age}
                </Text>
              )}
            </View>

            {/* Address - Optional */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Address (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: colors.text,
                    borderColor: errors.address ? colors.error : colors.border,
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  },
                ]}
                placeholder="Enter your address"
                placeholderTextColor={colors.textSecondary}
                value={address}
                onChangeText={(text) => {
                  setAddress(text)
                  if (errors.address) {
                    setErrors({ ...errors, address: undefined })
                  }
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {errors.address && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.address}
                </Text>
              )}
            </View>

            {/* Relationship Start Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Relationship Start Date</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.datePickerButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.datePickerText, { color: relationshipStartDate ? colors.text : colors.textSecondary }]}>
                  {relationshipStartDate
                    ? relationshipStartDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Select date when relationship started'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={relationshipStartDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios')
                    if (selectedDate) {
                      setRelationshipStartDate(selectedDate)
                    }
                  }}
                />
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={[styles.signOutButton, { borderColor: colors.error }]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.signOutButtonText, { color: colors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '90%',
    height: '85%', // Open modal to 85% of screen height
    flexDirection: 'column',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 8,
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileInfo: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  profileInfoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '400',
  },
  partnerCodeContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  partnerCodeValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    marginVertical: 8,
  },
  partnerCodeHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
})

