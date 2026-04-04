import { useTheme } from '@/providers/theme-provider'
import { Button } from 'heroui-native'
import { Ionicons } from '@expo/vector-icons'

export function ThemeSwitcher() {
  const { colorScheme, toggleColorScheme } = useTheme()

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      onPress={toggleColorScheme}
    >
      <Ionicons 
        name={colorScheme === 'dark' ? 'sunny' : 'moon'} 
        size={20} 
      />
    </Button>
  )
}
