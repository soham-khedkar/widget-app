import { useAuthContext } from '@/hooks/use-auth-context'
import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'

export default function SignOutButton() {
  const { signOut } = useAuthContext()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.error, borderColor: colors.border }]}
      onPress={handleSignOut}
    >
      <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
      <Text style={styles.buttonText}>Sign Out</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})