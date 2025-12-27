import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { PhotoCard } from './PhotoCard'
import { SneakPeekWithUrl } from '@/hooks/use-sneak-peek'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'
import { useAuthContext } from '@/hooks/use-auth-context'

interface PhotoGridProps {
  sneakPeeks: SneakPeekWithUrl[]
  onPhotoPress?: (peek: SneakPeekWithUrl) => void
  onDelete?: (peekId: string) => void
  onMarkViewed?: (peekId: string) => void
  refreshing?: boolean
  onRefresh?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

export function PhotoGrid({
  sneakPeeks,
  onPhotoPress,
  onDelete,
  onMarkViewed,
  refreshing = false,
  onRefresh,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: PhotoGridProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { session } = useAuthContext()

  const renderPhoto = ({ item }: { item: SneakPeekWithUrl }) => {
    const isOwn = item.user_id === session?.user.id

    return (
      <PhotoCard
        peek={item}
        isOwn={isOwn}
        onPress={() => {
          if (!isOwn && !item.viewed && onMarkViewed) {
            onMarkViewed(item.id)
          }
          onPhotoPress?.(item)
        }}
        onDelete={isOwn && onDelete ? () => onDelete(item.id) : undefined}
        onMarkViewed={!isOwn && !item.viewed && onMarkViewed ? () => onMarkViewed(item.id) : undefined}
      />
    )
  }

  const renderFooter = () => {
    if (!hasMore) return null

    return (
      <View style={styles.footer}>
        {loadingMore ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <TouchableOpacity
            style={[styles.loadMoreButton, { borderColor: colors.border, borderWidth: 2 }]}
            onPress={onLoadMore}
          >
            <Text style={[styles.loadMoreText, { color: colors.primary }]}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <FlatList
      data={sneakPeeks}
      renderItem={renderPhoto}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      ListFooterComponent={renderFooter}
      onEndReached={hasMore && !loadingMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
})


