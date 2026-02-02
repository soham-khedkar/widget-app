/**
 * Punch Card Display Component
 * Shows days together counter with punch button
 */

import { useState } from 'react'
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import type { PunchCard } from '@/types/database'
import { Ionicons } from '@expo/vector-icons'

interface PunchCardDisplayProps {
  punchCard: PunchCard | null
  daysTogether: number
  canPunchToday: boolean
  loading: boolean
  onPunch: () => Promise<boolean>
  onSetup: () => void
}

export function PunchCardDisplay({
  punchCard,
  daysTogether,
  canPunchToday,
  loading,
  onPunch,
  onSetup,
}: PunchCardDisplayProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [punching, setPunching] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handlePunch = async () => {
    if (!canPunchToday || punching) return

    setPunching(true)
    const success = await onPunch()
    setPunching(false)

    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!punchCard) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.setupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onSetup}
        activeOpacity={0.8}
      >
        <View style={[styles.iconCircle, { borderColor: colors.border }]}>
          <Ionicons name="heart-outline" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.setupTitle, { color: colors.primary }]}>Start Your Journey</Text>
        <Text style={[styles.setupSubtitle, { color: colors.textSecondary }]}>
          Set your relationship start date{'\n'}and track days together 💕
        </Text>
        <View style={[styles.setupButton, { borderColor: colors.primary }]}>
          <Text style={[styles.setupButtonText, { color: colors.primary }]}>Get Started</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>Days Together</Text>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={14} color="#FF6B6B" />
          <Text style={[styles.streakText, { color: colors.text }]}>{punchCard.current_streak}</Text>
        </View>
      </View>

      {/* Big Number Display */}
      <View style={styles.counterContainer}>
        <Text style={[styles.counterNumber, { color: colors.primary }]}>{daysTogether}</Text>
        <Text style={[styles.counterLabel, { color: colors.textSecondary }]}>days</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{punchCard.longest_streak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {new Date(punchCard.relationship_start_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Since</Text>
        </View>
      </View>

      {/* Punch Button */}
      <TouchableOpacity
        style={[
          styles.punchButton,
          {
            backgroundColor: canPunchToday ? colors.primary : colors.surface,
            borderColor: colors.primary,
          },
          !canPunchToday && styles.punchButtonDisabled,
        ]}
        onPress={handlePunch}
        disabled={!canPunchToday || punching}
        activeOpacity={0.8}
      >
        {punching ? (
          <ActivityIndicator color={canPunchToday ? colors.background : colors.primary} size="small" />
        ) : showSuccess ? (
          <>
            <Ionicons name="checkmark-circle" size={20} color={colors.background} />
            <Text style={[styles.punchButtonText, { color: colors.background }]}>Punched! 🎉</Text>
          </>
        ) : (
          <>
            <Ionicons
              name={canPunchToday ? 'finger-print' : 'checkmark-done'}
              size={20}
              color={canPunchToday ? colors.background : colors.textSecondary}
            />
            <Text
              style={[
                styles.punchButtonText,
                { color: canPunchToday ? colors.background : colors.textSecondary },
              ]}
            >
              {canPunchToday ? 'Punch In Today' : 'Already Punched'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
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
  setupCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  setupButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
  },
  setupButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  counterNumber: {
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80,
  },
  counterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: -4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  punchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  punchButtonDisabled: {
    opacity: 0.7,
  },
  punchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
