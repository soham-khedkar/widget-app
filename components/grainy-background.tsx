import { StyleSheet, View } from 'react-native'
import { useColorScheme } from '@/hooks/use-color-scheme'

interface GrainyBackgroundProps {
  children: React.ReactNode
}

export function GrainyBackground({ children }: GrainyBackgroundProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  // Monochrome background - simple and clean
  const backgroundColor = isDark ? '#000000' : '#FFFFFF'

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
