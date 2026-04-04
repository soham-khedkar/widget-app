import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
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
import { useTheme } from '@/providers/theme-provider'
import { supabase } from '@/lib/supabase'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Avatar, Button, Card, Surface } from 'heroui-native'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'

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
  if (!/^[a-zA-Z0-9\s,.'-]+$/.test(address.trim())) {
    return 'Address contains invalid characters'
  }
  return undefined
}

export default function ProfileScreen() {
  const { profile, refreshProfile, signOut } = useAuthContext()
  const { colorScheme } = useTheme()
  const colors = Colors[colorScheme ?? 'light']
  const router = useRouter()

  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [relationshipStartDate, setRelationshipStartDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Load profile data when screen opens
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setGender((profile.gender as 'male' | 'female' | 'other') || '')
      setAge(profile.age ? String(profile.age) : '')
      setAddress(profile.address || '')
      if (profile.relationship_start_date) {
        setRelationshipStartDate(new Date(profile.relationship_start_date))
      } else {
        setRelationshipStartDate(null)
      }
      // Load avatar if exists
      if (profile.avatar_url) {
        setAvatarUri(profile.avatar_url)
      }
    } else {
      setName('')
      setGender('')
      setAge('')
      setAddress('')
      setRelationshipStartDate(null)
      setAvatarUri(null)
    }
    setErrors({})
  }, [profile])

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload an avatar')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      await handleUploadAvatar(result.assets[0].uri)
    }
  }

  const handleUploadAvatar = async (uri: string) => {
    if (!profile?.id) return

    setUploadingAvatar(true)
    try {
      // Check if storage bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      
      if (bucketError) {
        throw new Error('Storage not configured. Please set up a storage bucket named "avatars" in Supabase.')
      }

      const avatarsBucket = buckets?.find(b => b.name === 'avatars')
      if (!avatarsBucket) {
        throw new Error('Storage bucket "avatars" not found. Please create it in Supabase Storage.')
      }

      // Convert image to blob
      const response = await fetch(uri)
      const blob = await response.blob()
      const fileExt = uri.split('.').pop()
      const fileName = `${profile.id}/avatar.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setAvatarUri(publicUrl)
      await refreshProfile()
      Alert.alert('Success', 'Avatar updated successfully!')
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      Alert.alert('Error', error.message || 'Failed to upload avatar. Make sure the "avatars" storage bucket exists in Supabase.')
    } finally {
      setUploadingAvatar(false)
    }
  }

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
      const updateData: any = {
        name: name.trim(),
        updated_at: new Date().toISOString(),
      }

      if (gender) {
        updateData.gender = gender
      }
      if (age.trim()) {
        updateData.age = parseInt(age, 10)
      }
      if (address.trim()) {
        updateData.address = address.trim()
      }
      
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
    } catch (error: any) {
      console.error('Profile update error:', error)
      Alert.alert('Error', error.message || 'Failed to update profile')
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
            router.replace('/login')
          },
        },
      ]
    )
  }

  const getInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return 'U'
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Avatar size="lg" className="mb-4">
              {avatarUri ? (
                <Avatar.Image src={avatarUri} alt={profile?.name || 'User'} />
              ) : null}
              <Avatar.Fallback>{getInitials()}</Avatar.Fallback>
            </Avatar>
            <Button
              size="sm"
              variant="outline"
              onPress={handlePickImage}
              isDisabled={uploadingAvatar}
            >
              <Text>{uploadingAvatar ? 'Uploading...' : 'Change Avatar'}</Text>
            </Button>
          </View>

          {/* Profile Info Display */}
          {profile && (
            <Card className="mb-4">
              <Card.Content>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.profileInfoValue, { color: colors.text }]}>{profile.email || 'N/A'}</Text>
                </View>
                
                {profile.partner_code && (
                  <View style={[styles.partnerCodeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Your Partner Code</Text>
                    <Text style={[styles.partnerCodeValue, { color: colors.primary }]}>{profile.partner_code}</Text>
                    <Text style={[styles.partnerCodeHint, { color: colors.textSecondary }]}>
                      Share this code with your partner to connect
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
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
                <Button
                  key={g}
                  variant={gender === g ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => setGender(g)}
                >
                  <Text>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                </Button>
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
            <Button
              variant="outline"
              onPress={() => setShowDatePicker(true)}
              className="w-full"
            >
              <Text>
                {relationshipStartDate
                  ? relationshipStartDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Select date when relationship started'}
              </Text>
            </Button>
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
          <Button
            className="w-full mt-2 mb-4"
            onPress={handleSave}
            isDisabled={loading}
            size="lg"
          >
            <Text>{loading ? 'Saving...' : 'Save Changes'}</Text>
          </Button>

          {/* Sign Out Button */}
          <Button
            variant="outline"
            className="w-full"
            onPress={handleSignOut}
            size="lg"
          >
            <Ionicons name="log-out-outline" size={20} style={{ marginRight: 8 }} />
            <Text>Sign Out</Text>
          </Button>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
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
    marginTop: 16,
    borderWidth: 2,
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
})
