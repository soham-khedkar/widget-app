import { CameraModal } from '@/components/sneak-peek/CameraModal'
import { PhotoDetailModal } from '@/components/sneak-peek/PhotoDetailModal'
import { PhotoGrid } from '@/components/sneak-peek/PhotoGrid'
import { Colors } from '@/constants/theme'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { SneakPeekWithUrl, useSneakPeek } from '@/hooks/use-sneak-peek'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SneakPeekScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { session } = useAuthContext()
  const {
    sneakPeeks,
    loading,
    error,
    uploading,
    fetchSneakPeeks,
    createSneakPeek,
    markAsViewed,
    deleteSneakPeek,
    getUnviewedCount,
    loadMore,
    hasMore,
    loadingMore,
  } = useSneakPeek()

  const [showCameraModal, setShowCameraModal] = useState(false)
  const [selectedPeek, setSelectedPeek] = useState<SneakPeekWithUrl | null>(null)
  const unviewedCount = getUnviewedCount()
  const router = useRouter()
  const params = useLocalSearchParams()

  // Handle deep link to open specific photo
  useEffect(() => {
    if (params.id && sneakPeeks.length > 0) {
      const photo = sneakPeeks.find((p) => p.id === params.id)
      if (photo) {
        setSelectedPeek(photo)
      }
    }
  }, [params.id, sneakPeeks])

  const handleImageSelected = async (uri: string, caption?: string) => {
    const result = await createSneakPeek(uri, caption)
    if (result.error) {
      Alert.alert('Error', result.error)
    } else {
      setShowCameraModal(false)
      // Modal closes, user stays on sneak peek page - no alert needed
    }
  }

  const handleDelete = async (peekId: string) => {
    const result = await deleteSneakPeek(peekId)
    if (result.error) {
      Alert.alert('Error', result.error)
    }
  }

  const handlePhotoPress = (peek: SneakPeekWithUrl) => {
    // Mark as viewed if it's from partner and not viewed
    if (peek.partner_id === session?.user.id && !peek.viewed) {
      markAsViewed(peek.id)
    }
    setSelectedPeek(peek)
  }

  if (loading && sneakPeeks.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading sneak peeks...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.primary }]}>Sneak Peek</Text>
              {unviewedCount > 0 && (
                <Text style={[styles.unviewedCount, { color: colors.primary }]}>
                  {unviewedCount} new
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.addButton, { borderColor: colors.border, borderWidth: 2 }]}
              onPress={() => setShowCameraModal(true)}
            >
              <Ionicons name="camera" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Photo Grid */}
          {sneakPeeks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="camera-outline"
                size={64}
                color={colors.textSecondary}
                style={{ opacity: 0.3, marginBottom: 16 }}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No sneak peeks yet.{'\n'}Share a moment with your partner!
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyButton,
                  { borderColor: colors.border, borderWidth: 2, backgroundColor: colors.surface },
                ]}
                onPress={() => setShowCameraModal(true)}
              >
                <Ionicons name="camera" size={20} color={colors.primary} />
                <Text style={[styles.emptyButtonText, { color: colors.primary }]}>
                  Take Your First Photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <PhotoGrid
              sneakPeeks={sneakPeeks}
              onPhotoPress={handlePhotoPress}
              onDelete={handleDelete}
              onMarkViewed={markAsViewed}
              refreshing={loading}
              onRefresh={() => fetchSneakPeeks(true)}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          )}
        </View>

        {/* Camera Modal */}
        <CameraModal
          visible={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onImageSelected={handleImageSelected}
          uploading={uploading}
        />

        {/* Photo Detail Modal */}
        <PhotoDetailModal
          visible={selectedPeek !== null}
          peek={selectedPeek}
          isOwn={selectedPeek?.user_id === session?.user.id}
          onClose={() => setSelectedPeek(null)}
          onDelete={selectedPeek ? () => handleDelete(selectedPeek.id) : undefined}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  unviewedCount: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
