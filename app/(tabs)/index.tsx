import { useState } from 'react'
import { StyleSheet, View, Text, ScrollView, Platform, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'
import { GrainyBackground } from '@/components/grainy-background'
import { ProfileModal } from '@/components/profile-modal'
import { Ionicons } from '@expo/vector-icons'

export default function HomeScreen() {
  const { profile, signOut } = useAuthContext()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const router = useRouter()
  const [profileModalVisible, setProfileModalVisible] = useState(false)

  // Mock data for now - will be replaced with real data
  const connectionScore = profile?.partner_id ? 85 : 0
  const todosCount = 0
  const messagesCount = 0
  const photosCount = 0

  // Stats dashboard cells with doodle-style irregular shapes
  const stats = [
    {
      id: 'score',
      label: 'Connection',
      value: connectionScore,
      unit: '/100',
      icon: 'heart',
      color: colors.primary,
      size: 'large', // Takes full width
    },
    {
      id: 'profile',
      label: 'Profile',
      value: profile?.name ? 'Edit' : 'Setup',
      icon: 'person',
      color: colors.primary,
      size: 'medium', // Takes half width
    },
    {
      id: 'todos',
      label: 'Todos',
      value: todosCount,
      icon: 'checkmark-circle',
      color: colors.primary,
      size: 'small', // Takes half width
    },
    {
      id: 'messages',
      label: 'Messages',
      value: messagesCount,
      icon: 'chatbubble',
      color: colors.primary,
      size: 'small', // Takes half width
    },
  ]

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <GrainyBackground>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logout Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: colors.border, borderWidth: 2 }]}
              onPress={async () => {
                await signOut()
                router.replace('/login')
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.primary} />
              <Text style={[styles.logoutText, { color: colors.primary }]}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Dashboard Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => {
              const isLarge = stat.size === 'large'
              const isMedium = stat.size === 'medium'
              const isSmall = stat.size === 'small'

              return (
                <View
                  key={stat.id}
                  style={[
                    styles.statCard,
                    isLarge && styles.statCardLarge,
                    isMedium && styles.statCardMedium,
                    isSmall && styles.statCardSmall,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.statCardTouchable}
                    onPress={() => {
                      if (stat.id === 'profile') {
                        setProfileModalVisible(true)
                      } else if (stat.id === 'todos') {
                        router.push('/(tabs)/todos')
                      } else if (stat.id === 'messages') {
                        router.push('/(tabs)/messages')
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.statIconContainer, { borderColor: colors.border, borderWidth: 2 }]}>
                      <Ionicons name={stat.icon as any} size={isLarge ? 32 : 24} color={colors.primary} />
                    </View>
                    {isLarge ? (
                      <>
                        <Text style={[styles.statValueLarge, { color: colors.primary }]}>
                          {stat.value}
                        </Text>
                        <Text style={[styles.statUnitLarge, { color: colors.textSecondary }]}>
                          {stat.unit}
                        </Text>
                        <Text style={[styles.statLabelLarge, { color: colors.textSecondary }]}>
                          {stat.label}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {typeof stat.value === 'number' ? stat.value : stat.value}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          {stat.label}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        </ScrollView>

        {/* Profile Modal */}
        <ProfileModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
        />
      </GrainyBackground>
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
  contentContainer: {
    padding: 16,
    paddingTop: 12,
    minHeight: '100%',
  },
  header: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    borderRadius: 24,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 4,
    }),
  },
  statCardLarge: {
    width: '100%',
    minHeight: 200,
    padding: 28,
    marginBottom: 16,
  },
  statCardMedium: {
    width: '47%',
    minHeight: 200,
    padding: 24,
    marginBottom: 16,
  },
  statCardSmall: {
    width: '47%',
    minHeight: 140,
    padding: 20,
    marginBottom: 16,
  },
  statCardTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  statValueLarge: {
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 64,
  },
  statUnitLarge: {
    fontSize: 20,
    fontWeight: '500',
    marginTop: -8,
  },
  statLabelLarge: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
})