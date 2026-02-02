import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SneakPeekWithUrl } from '@/hooks/use-sneak-peek'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'
import { Platform } from 'react-native'

interface PhotoCardProps {
  peek: SneakPeekWithUrl
  isOwn: boolean
  onPress?: () => void
  onDelete?: () => void
  onMarkViewed?: () => void
}

export function PhotoCard({ peek, isOwn, onPress, onDelete, onMarkViewed }: PhotoCardProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {peek.signedUrl ? (
          <Image source={{ uri: peek.signedUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.border }]}>
            <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
          </View>
        )}
        
        {/* Unviewed badge */}
        {!isOwn && !peek.viewed && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.background }]}>New</Text>
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
            <Ionicons name="trash" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Caption */}
      {peek.caption && (
        <Text style={[styles.caption, { color: colors.text }]} numberOfLines={2}>
          {peek.caption}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
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
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caption: {
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
  },
})
