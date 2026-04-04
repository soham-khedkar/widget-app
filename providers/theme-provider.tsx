import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react'
import { useColorScheme as useRNColorScheme } from 'react-native'
import { Uniwind } from 'uniwind'

type ColorScheme = 'light' | 'dark'

interface ThemeContextType {
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useRNColorScheme()
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemColorScheme || 'light')

  // Sync with system theme changes
  useEffect(() => {
    if (systemColorScheme) {
      setColorSchemeState(systemColorScheme)
      Uniwind.setTheme(systemColorScheme)
    }
  }, [systemColorScheme, setTheme])

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme)
    Uniwind.setTheme(scheme)
  }

  const toggleColorScheme = () => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark'
    setColorScheme(newScheme)
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, toggleColorScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Export as ThemeProvider for convenience
export const ThemeProvider = AppThemeProvider

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
