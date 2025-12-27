import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'
import { SneakPeekWithUrl } from '@/hooks/use-sneak-peek'
import { Image as ExpoImage } from 'expo-image'

interface PhotoCardProps {
  peek: SneakPeekWithUrl
  onPress?: () => void
  onDelete?: () => void
  onMarkViewed?: () => void
  isOwn?: boolean
}

export function PhotoCard({ peek, onPress, onDelete, onMarkViewed, isOwn }: PhotoCardProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Create a simple blurred placeholder (low-quality base64)
  const placeholder = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image with blur placeholder */}
      <View style={styles.imageContainer}>
        {peek.signedUrl ? (
          <>
            {imageLoading && (
              <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            <ExpoImage
              source={{ uri: peek.signedUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              placeholder={placeholder}
              placeholderContentFit="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true)
                setImageLoading(false)
              }}
            />
            {imageError && (
              <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                  Failed to load
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Unviewed badge */}
        {!peek.viewed && !isOwn && (
          <View style={[styles.unviewedBadge, { backgroundColor: colors.primary }]}>
            <View style={[styles.unviewedDot, { backgroundColor: colors.background }]} />
          </View>
        )}

        {/* Delete button (only for own photos) */}
        {isOwn && onDelete && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error + 'CC' }]}
            onPress={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Ionicons name="trash" size={16} color={colors.background} />
          </TouchableOpacity>
        )}
      </View>

      {/* Caption */}
      {peek.caption && (
        <View style={styles.captionContainer}>
          <Text style={[styles.caption, { color: colors.textSecondary }]} numberOfLines={2}>
            {peek.caption}
          </Text>
        </View>
      )}

      {/* View status */}
      <View style={styles.footer}>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {new Date(peek.created_at).toLocaleDateString()}
        </Text>
        {peek.viewed && !isOwn && (
          <View style={styles.viewedIndicator}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.viewedText, { color: colors.success }]}>Viewed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
  },
  unviewedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unviewedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    padding: 12,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  viewedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewedText: {
    fontSize: 12,
    fontWeight: '500',
  },
})



