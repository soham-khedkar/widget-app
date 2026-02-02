/**
 * Punch Card Hook
 * Manages punch card state and operations for LDR day counting
 */

import { punchCardService } from '@/backend/services'
import type { PunchCard, Streak } from '@/types/database'
import { useCallback, useEffect, useState } from 'react'
import { useAuthContext } from './use-auth-context'

interface UsePunchCardReturn {
  // Punch card state
  punchCard: PunchCard | null
  loading: boolean
  error: string | null
  
  // Streaks state
  streaks: Streak[]
  streaksLoading: boolean
  
  // Computed values
  daysTogether: number
  canPunchToday: boolean
  
  // Actions
  createPunchCard: (startDate: string) => Promise<boolean>
  punch: () => Promise<boolean>
  refresh: () => Promise<void>
  
  // Streak actions
  createStreak: (topic: string, description?: string, target?: number) => Promise<boolean>
  checkInStreak: (streakId: string) => Promise<boolean>
  regenerateBackground: (streakId: string) => Promise<string[] | null>
  deleteStreak: (streakId: string) => Promise<boolean>
}

export function usePunchCard(): UsePunchCardReturn {
  const { profile, session } = useAuthContext()
  const userId = session?.user?.id
  const [punchCard, setPunchCard] = useState<PunchCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [streaksLoading, setStreaksLoading] = useState(true)
  
  // Calculate days together from relationship start date
  const daysTogether = punchCard
    ? Math.ceil(
        Math.abs(
          new Date().getTime() - new Date(punchCard.relationship_start_date).getTime()
        ) / (1000 * 60 * 60 * 24)
      )
    : 0
  
  // Check if user can punch today
  const canPunchToday = punchCard
    ? punchCard.last_punch_date !== new Date().toISOString().split('T')[0]
    : false
  
  // Fetch punch card
  const fetchPunchCard = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await punchCardService.getPunchCard(userId)
      setPunchCard(data)
    } catch (error) {
      setError('Failed to load punch card')
      console.error('Error fetching punch card:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])
  
  // Fetch streaks
  const fetchStreaks = useCallback(async () => {
    if (!userId) {
      setStreaksLoading(false)
      return
    }
    
    setStreaksLoading(true)
    
    try {
      const data = await punchCardService.getStreaks(userId)
      setStreaks(data)
    } catch (error) {
      console.error('Error fetching streaks:', error)
    } finally {
      setStreaksLoading(false)
    }
  }, [userId])
  
  // Initial fetch
  useEffect(() => {
    fetchPunchCard()
    fetchStreaks()
  }, [fetchPunchCard, fetchStreaks])
  
  // Create punch card
  const createPunchCard = async (startDate: string): Promise<boolean> => {
    if (!userId) return false
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await punchCardService.createPunchCard(
        userId,
        startDate,
        profile?.partner_id || undefined
      )
      
      if (data) {
        setPunchCard(data)
        return true
      }
      
      setError('Failed to create punch card')
      return false
    } catch {
      setError('An error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }
  
  // Punch in
  const punch = async (): Promise<boolean> => {
    if (!userId) return false
    
    setError(null)
    
    try {
      const result = await punchCardService.punch(userId)
      
      if (result.success && result.punchCard) {
        setPunchCard(result.punchCard)
        return true
      }
      
      setError(result.error || 'Failed to punch')
      return false
    } catch {
      setError('An error occurred')
      return false
    }
  }
  
  // Refresh all data
  const refresh = async () => {
    await Promise.all([fetchPunchCard(), fetchStreaks()])
  }
  
  // Create streak
  const createStreak = async (
    topic: string,
    description?: string,
    target?: number
  ): Promise<boolean> => {
    if (!userId) return false
    
    try {
      const result = await punchCardService.createStreak(
        userId,
        topic,
        description,
        target,
        profile?.partner_id || undefined
      )
      
      if (result.success && result.streak) {
        setStreaks(prev => [result.streak!, ...prev])
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error creating streak:', error)
      return false
    }
  }
  
  // Check in to streak
  const checkInStreak = async (streakId: string): Promise<boolean> => {
    if (!userId) return false
    
    try {
      const result = await punchCardService.checkInStreak(userId, streakId)
      
      if (result.success && result.streak) {
        setStreaks(prev =>
          prev.map(s => (s.id === streakId ? result.streak! : s))
        )
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error checking in streak:', error)
      return false
    }
  }
  
  // Regenerate streak background
  const regenerateBackground = async (streakId: string): Promise<string[] | null> => {
    if (!userId) return null
    
    try {
      const result = await punchCardService.regenerateStreakBackground(userId, streakId)
      
      if (result.success && result.colors) {
        setStreaks(prev =>
          prev.map(s =>
            s.id === streakId ? { ...s, background_colors: result.colors! } : s
          )
        )
        return result.colors
      }
      
      return null
    } catch (error) {
      console.error('Error regenerating background:', error)
      return null
    }
  }
  
  // Delete streak
  const deleteStreak = async (streakId: string): Promise<boolean> => {
    if (!userId) return false
    
    try {
      const success = await punchCardService.deleteStreak(userId, streakId)
      
      if (success) {
        setStreaks(prev => prev.filter(s => s.id !== streakId))
      }
      
      return success
    } catch (error) {
      console.error('Error deleting streak:', error)
      return false
    }
  }
  
  return {
    punchCard,
    loading,
    error,
    streaks,
    streaksLoading,
    daysTogether,
    canPunchToday,
    createPunchCard,
    punch,
    refresh,
    createStreak,
    checkInStreak,
    regenerateBackground,
    deleteStreak,
  }
}
