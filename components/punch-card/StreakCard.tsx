/**
 * Streak Card Component
 * Displays a single streak with AI-generated gradient background
 */

import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import type { Streak } from '@/types/database'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

interface StreakCardProps {
  streak: Streak
  onCheckIn: () => Promise<boolean>
  onRegenerateBackground: () => Promise<string[] | null>
  onDelete: () => Promise<boolean>
}

export function StreakCard({
  streak,
  onCheckIn,
  onRegenerateBackground,
  onDelete,
}: StreakCardProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [checkingIn, setCheckingIn] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const checkedToday = streak.last_checked_date === today

  const handleCheckIn = async () => {
    if (checkedToday || checkingIn) return

    setCheckingIn(true)
    const success = await onCheckIn()
    setCheckingIn(false)

    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  const handleRegenerate = async () => {
    if (regenerating) return
    setRegenerating(true)
    await onRegenerateBackground()
    setRegenerating(false)
  }

  // Default gradient colors if AI hasn't generated yet
  const gradientColors = streak.background_colors?.length
    ? streak.background_colors
    : colorScheme === 'dark'
    ? ['#2D2D2D', '#1A1A1A']
    : ['#F5F5F5', '#E0E0E0']

  const progress = streak.target_count
    ? Math.min(100, (streak.current_count / streak.target_count) * 100)
    : null

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.topicContainer}>
            <Ionicons name="flame" size={18} color="#FF6B6B" />
            <Text style={styles.topic} numberOfLines={1}>
              {streak.topic}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleRegenerate}
              style={styles.iconButton}
              disabled={regenerating}
            >
              {regenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="color-palette-outline" size={18} color="rgba(255,255,255,0.8)" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Count Display */}
        <View style={styles.countContainer}>
          <Text style={styles.count}>{streak.current_count}</Text>
          {streak.target_count && (
            <Text style={styles.target}>/ {streak.target_count}</Text>
          )}
        </View>

        {/* Description */}
        {streak.description && (
          <Text style={styles.description} numberOfLines={2}>
            {streak.description}
          </Text>
        )}

        {/* Progress Bar */}
        {progress !== null && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{streak.longest_count}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          {streak.last_checked_date && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {new Date(streak.last_checked_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.statLabel}>Last</Text>
            </View>
          )}
        </View>

        {/* Check-in Button */}
        <TouchableOpacity
          style={[styles.checkInButton, checkedToday && styles.checkInButtonDone]}
          onPress={handleCheckIn}
          disabled={checkedToday || checkingIn}
          activeOpacity={0.8}
        >
          {checkingIn ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : showSuccess ? (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.checkInText}>Done! 🎉</Text>
            </>
          ) : (
            <>
              <Ionicons
                name={checkedToday ? 'checkmark-done' : 'add-circle'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.checkInText}>
                {checkedToday ? 'Checked In ✓' : 'Check In'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 4,
    }),
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  topic: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  count: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  target: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
    lineHeight: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    width: 40,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  checkInButtonDone: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  checkInText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
