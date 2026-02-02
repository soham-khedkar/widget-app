import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { SneakPeekWithUrl } from '@/hooks/use-sneak-peek'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as FileSystem from 'expo-file-system/legacy'
import { Image } from 'expo-image'
import * as Sharing from 'expo-sharing'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

interface PhotoDetailModalProps {
  visible: boolean
  peek: SneakPeekWithUrl | null
  isOwn: boolean
  onClose: () => void
  onDelete?: () => void
}

export function PhotoDetailModal({
  visible,
  peek,
  isOwn,
  onClose,
  onDelete,
}: PhotoDetailModalProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [imageLoading, setImageLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  // Hide any existing toasts when modal opens
  useEffect(() => {
    if (visible) {
      Toast.hide()
    }
  }, [visible])

  if (!peek || !peek.signedUrl) return null

  const handleShare = async () => {
    if (!peek.signedUrl) return

    try {
      setSharing(true)

      // Download the image to a local file first (required for native sharing)
      const fileUri = FileSystem.documentDirectory + `sneak_peek_${Date.now()}.jpg`
      const downloadResult = await FileSystem.downloadAsync(peek.signedUrl, fileUri)

      if (!downloadResult.uri) {
        throw new Error('Failed to download image')
      }

      // Use expo-sharing to share the local file (opens native share sheet)
      const isAvailable = await Sharing.isAvailableAsync()
      
      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share sneak peek',
        })
      } else {
        // Fallback: copy URL to clipboard if sharing not available
        await Clipboard.setStringAsync(peek.signedUrl)
        // Android/iOS shows native "copied to clipboard" notification
      }

      // Clean up the temporary file after a delay
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true })
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }
      }, 5000)
    } catch (err: any) {
      console.error('Error sharing:', err)
      // If sharing fails, fallback to copying URL
      try {
        await Clipboard.setStringAsync(peek.signedUrl)
        // Android/iOS shows native "copied to clipboard" notification
      } catch (copyErr) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to share',
          position: 'bottom',
          visibilityTime: 2000,
        })
      }
    } finally {
      setSharing(false)
    }
  }

  const handleCopy = async () => {
    if (!peek.signedUrl) return

    try {
      await Clipboard.setStringAsync(peek.signedUrl)
      // Android/iOS shows native "copied to clipboard" notification, no need for custom toast
    } catch (err) {
      console.error('Error copying:', err)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to copy URL',
        position: 'bottom',
        visibilityTime: 2000,
      })
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete Sneak Peek', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete?.()
          onClose()
        },
      },
    ])
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface + 'F0' }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Sneak Peek</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          <Image
            source={{ uri: peek.signedUrl }}
            style={styles.image}
            contentFit="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoad={() => setImageLoading(false)}
            transition={200}
          />
        </View>

        {/* Caption */}
        {peek.caption && (
          <View style={[styles.captionContainer, { backgroundColor: colors.surface + 'F0' }]}>
            <Text style={[styles.caption, { color: colors.primary }]}>{peek.caption}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={[styles.actionsContainer, { backgroundColor: colors.surface + 'F0' }]}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border, borderWidth: 2 }]}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="share-outline" size={24} color={colors.primary} />
            )}
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border, borderWidth: 2 }]}
            onPress={handleCopy}
          >
            <Ionicons name="copy-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Copy</Text>
          </TouchableOpacity>

          {isOwn && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  borderColor: colors.error,
                  borderWidth: 2,
                  backgroundColor: colors.error + '20',
                },
              ]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface + 'F0' }]}>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {new Date(peek.created_at).toLocaleString()}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  caption: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
  },
})

