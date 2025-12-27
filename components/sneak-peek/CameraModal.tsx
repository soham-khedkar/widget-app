import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useCameraPermissions } from 'expo-camera'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'

interface CameraModalProps {
  visible: boolean
  onClose: () => void
  onImageSelected: (uri: string, caption?: string) => void
  uploading?: boolean
}

export function CameraModal({ visible, onClose, onImageSelected, uploading }: CameraModalProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [mode, setMode] = useState<'camera' | 'gallery' | 'preview' | 'caption'>('camera')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [permission, requestPermission] = useCameraPermissions()

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission()
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos')
        return
      }
    }

    // Use ImagePicker with camera mode - allowsEditing shows crop/retake options
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri)
      setMode('preview') // Show preview with retake/OK options
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setMode('camera')
  }

  const handleUsePhoto = () => {
    if (capturedImage) {
      setMode('caption') // Move to caption screen
    }
  }

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required to select photos')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri)
      setMode('caption')
    }
  }

  const handleSubmit = () => {
    if (capturedImage) {
      onImageSelected(capturedImage, caption.trim() || undefined)
      setCapturedImage(null)
      setCaption('')
      setMode('camera')
    }
  }

  const handleCancel = () => {
    setCapturedImage(null)
    setCaption('')
    setMode('camera')
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="close" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            {mode === 'caption' ? 'Add Caption' : mode === 'preview' ? 'Preview Photo' : 'New Sneak Peek'}
          </Text>
          {mode === 'caption' ? (
            <TouchableOpacity onPress={handleSubmit} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.submitButton, { color: colors.primary }]}>Post</Text>
              )}
            </TouchableOpacity>
          ) : mode === 'preview' ? (
            <TouchableOpacity onPress={handleUsePhoto}>
              <Text style={[styles.submitButton, { color: colors.primary }]}>OK</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>

        {/* Content */}
        {mode === 'camera' ? (
          <View style={styles.cameraContainer}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border, borderWidth: 2 }]}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={32} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border, borderWidth: 2 }]}
                onPress={handlePickFromGallery}
              >
                <Ionicons name="images" size={32} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : mode === 'preview' && capturedImage ? (
          <View style={styles.previewContainer}>
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: capturedImage }}
                style={styles.previewImage}
                contentFit="contain"
              />
            </View>
            <View style={[styles.previewActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.previewButton, { borderColor: colors.border, borderWidth: 2 }]}
                onPress={handleRetake}
              >
                <Ionicons name="refresh" size={24} color={colors.primary} />
                <Text style={[styles.previewButtonText, { color: colors.primary }]}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewButton, { borderColor: colors.border, borderWidth: 2, backgroundColor: colors.primary }]}
                onPress={handleUsePhoto}
              >
                <Ionicons name="checkmark" size={24} color={colors.background} />
                <Text style={[styles.previewButtonText, { color: colors.background }]}>Use Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : mode === 'caption' && capturedImage ? (
          <View style={styles.captionContainer}>
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: capturedImage }}
                style={styles.previewImage}
                contentFit="contain"
              />
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: colors.surface + 'CC' }]}
                onPress={() => setMode('preview')}
              >
                <Ionicons name="arrow-back" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.captionInputContainer}>
              <TextInput
                style={[
                  styles.captionInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 2,
                    color: colors.primary,
                  },
                ]}
                placeholder="Add a caption (optional)"
                placeholderTextColor={colors.textSecondary}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={200}
                autoFocus
              />
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  submitButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
  },
  captionContainer: {
    flex: 1,
  },
  imagePreview: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionInputContainer: {
    padding: 16,
  },
  captionInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
})

