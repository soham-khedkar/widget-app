import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { QuickMessage } from '@/types/database'
import { View, Text, StyleSheet } from 'react-native'

interface MessageBubbleProps {
  message: QuickMessage
  isOwn: boolean
  partnerName?: string
}

export function MessageBubble({ message, isOwn, partnerName }: MessageBubbleProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.partnerContainer]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
        ]}
      >
        {!isOwn && partnerName && (
          <Text style={[styles.senderName, { color: colors.primary }]}>{partnerName}</Text>
        )}
        <Text
          style={[
            styles.text,
            { color: isOwn ? '#fff' : colors.text },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.time,
            { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.muted },
          ]}
        >
          {time}
          {isOwn && message.read && ' ✓'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 12,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  partnerContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
})
