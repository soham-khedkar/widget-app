import { ProfileModal } from '@/components/profile-modal'
import {
    CreateStreakModal,
    PunchCardDisplay,
    SetupPunchCardModal,
    StreakCard,
} from '@/components/punch-card'
import { Colors } from '@/constants/theme'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { usePunchCard } from '@/hooks/use-punch-card'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const { profile, signOut } = useAuthContext()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const router = useRouter()

  const [profileModalVisible, setProfileModalVisible] = useState(false)
  const [setupPunchCardVisible, setSetupPunchCardVisible] = useState(false)
  const [createStreakVisible, setCreateStreakVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const {
    punchCard,
    loading: punchCardLoading,
    daysTogether,
    canPunchToday,
    streaks,
    streaksLoading,
    createPunchCard,
    punch,
    refresh,
    createStreak,
    checkInStreak,
    regenerateBackground,
    deleteStreak,
  } = usePunchCard()

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }, [refresh])

  // Quick access cards data
  const quickActions = [
    {
      id: 'messages',
      label: 'Messages',
      icon: 'chatbubble',
      color: '#FF6B9D',
      onPress: () => router.push('/(tabs)/messages'),
    },
    {
      id: 'sneak-peek',
      label: 'Photos',
      icon: 'camera',
      color: '#6B9DFF',
      onPress: () => router.push('/(tabs)/sneak-peek'),
    },
    {
      id: 'todos',
      label: 'Todos',
      icon: 'checkmark-circle',
      color: '#6BFFB8',
      onPress: () => router.push('/(tabs)/todos'),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person',
      color: '#FFB86B',
      onPress: () => setProfileModalVisible(true),
    },
  ]

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {getGreeting()},
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {profile?.name || 'Love Bird'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.settingsButton, { borderColor: colors.border }]}
                onPress={async () => {
                  await signOut()
                  router.replace('/login')
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Punch Card */}
          <PunchCardDisplay
            punchCard={punchCard}
            daysTogether={daysTogether}
            canPunchToday={canPunchToday}
            loading={punchCardLoading}
            onPunch={punch}
            onSetup={() => setSetupPunchCardVisible(true)}
          />

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Access</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.quickActionCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                    <Ionicons name={action.icon as any} size={22} color={action.color} />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Streaks Section */}
          <View style={styles.streaksSection}>
            <View style={styles.streaksHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Streaks 🔥</Text>
              <TouchableOpacity
                style={[styles.addStreakButton, { borderColor: colors.primary }]}
                onPress={() => setCreateStreakVisible(true)}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[styles.addStreakText, { color: colors.primary }]}>New</Text>
              </TouchableOpacity>
            </View>

            {streaksLoading ? (
              <View style={[styles.emptyStreaks, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyStreaksText, { color: colors.textSecondary }]}>
                  Loading streaks...
                </Text>
              </View>
            ) : streaks.length === 0 ? (
              <TouchableOpacity
                style={[styles.emptyStreaks, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setCreateStreakVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="flame-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyStreaksTitle, { color: colors.text }]}>
                  No streaks yet
                </Text>
                <Text style={[styles.emptyStreaksText, { color: colors.textSecondary }]}>
                  Create daily habits with your partner{'\n'}and watch your streaks grow! ✨
                </Text>
              </TouchableOpacity>
            ) : (
              streaks.map((streak) => (
                <StreakCard
                  key={streak.id}
                  streak={streak}
                  onCheckIn={() => checkInStreak(streak.id)}
                  onRegenerateBackground={() => regenerateBackground(streak.id)}
                  onDelete={() => deleteStreak(streak.id)}
                />
              ))
            )}
          </View>

          {/* Partner Status */}
          {!profile?.partner_id && (
            <TouchableOpacity
              style={[styles.partnerBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/partner-setup')}
              activeOpacity={0.8}
            >
              <View style={styles.partnerBannerContent}>
                <Ionicons name="people" size={24} color={colors.primary} />
                <View style={styles.partnerBannerText}>
                  <Text style={[styles.partnerBannerTitle, { color: colors.text }]}>
                    Connect with Partner
                  </Text>
                  <Text style={[styles.partnerBannerSubtitle, { color: colors.textSecondary }]}>
                    Share codes and sync your journey
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Modals - Only render when visible for better performance */}
        {profileModalVisible && (
          <ProfileModal visible={profileModalVisible} onClose={() => setProfileModalVisible(false)} />
        )}

        {setupPunchCardVisible && (
          <SetupPunchCardModal
            visible={setupPunchCardVisible}
            onClose={() => setSetupPunchCardVisible(false)}
            onCreate={createPunchCard}
          />
        )}

        {createStreakVisible && (
          <CreateStreakModal
            visible={createStreakVisible}
            onClose={() => setCreateStreakVisible(false)}
            onCreate={createStreak}
          />
        )}
    </SafeAreaView>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 2,
    }),
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  streaksSection: {
    marginBottom: 24,
  },
  streaksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addStreakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 2,
  },
  addStreakText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStreaks: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 2,
  },
  emptyStreaksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStreaksText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  partnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
  },
  partnerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerBannerText: {
    flex: 1,
  },
  partnerBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  partnerBannerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 20,
  },
})