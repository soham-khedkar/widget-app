/**
 * Punch Card Service
 * Manages LDR day counting and streak tracking
 */

import { supabase } from '@/lib/supabase'
import { geminiAI } from './gemini-ai'

export interface PunchCard {
  id: string
  user_id: string
  partner_id: string | null
  relationship_start_date: string
  total_days: number
  last_punch_date: string | null
  current_streak: number
  longest_streak: number
  created_at: string
  updated_at: string
}

export interface Streak {
  id: string
  user_id: string
  partner_id: string | null
  topic: string
  description: string | null
  background_colors: string[] | null
  background_style: string | null
  current_count: number
  longest_count: number
  last_checked_date: string | null
  target_count: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PunchCardStats {
  totalDays: number
  currentStreak: number
  longestStreak: number
  daysThisWeek: number
  daysThisMonth: number
}

export class PunchCardService {
  /**
   * Get or create punch card for user
   */
  async getPunchCard(userId: string): Promise<PunchCard | null> {
    try {
      const { data, error } = await supabase
        .from('punch_cards')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching punch card:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error in getPunchCard:', error)
      return null
    }
  }
  
  /**
   * Create a new punch card
   */
  async createPunchCard(
    userId: string,
    relationshipStartDate: string,
    partnerId?: string
  ): Promise<PunchCard | null> {
    try {
      // Calculate initial days
      const startDate = new Date(relationshipStartDate)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - startDate.getTime())
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      const { data, error } = await supabase
        .from('punch_cards')
        .insert({
          user_id: userId,
          partner_id: partnerId || null,
          relationship_start_date: relationshipStartDate,
          total_days: totalDays,
          current_streak: 0,
          longest_streak: 0,
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating punch card:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error in createPunchCard:', error)
      return null
    }
  }
  
  /**
   * Punch in for today
   */
  async punch(userId: string): Promise<{ success: boolean; punchCard?: PunchCard; error?: string }> {
    try {
      const existing = await this.getPunchCard(userId)
      
      if (!existing) {
        return { success: false, error: 'No punch card found. Please create one first.' }
      }
      
      const today = new Date().toISOString().split('T')[0]
      const lastPunch = existing.last_punch_date
      
      // Check if already punched today
      if (lastPunch === today) {
        return { success: false, error: 'Already punched in today!' }
      }
      
      // Calculate new streak
      let newStreak = 1
      if (lastPunch) {
        const lastDate = new Date(lastPunch)
        const todayDate = new Date(today)
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          // Consecutive day, increment streak
          newStreak = existing.current_streak + 1
        }
        // Otherwise reset to 1
      }
      
      const longestStreak = Math.max(existing.longest_streak, newStreak)
      
      // Recalculate total days from start date
      const startDate = new Date(existing.relationship_start_date)
      const now = new Date()
      const totalDays = Math.ceil(Math.abs(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const { data, error } = await supabase
        .from('punch_cards')
        .update({
          last_punch_date: today,
          current_streak: newStreak,
          longest_streak: longestStreak,
          total_days: totalDays,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) {
        console.error('Error punching card:', error)
        return { success: false, error: 'Failed to punch in' }
      }
      
      return { success: true, punchCard: data }
    } catch (error) {
      console.error('Error in punch:', error)
      return { success: false, error: 'An error occurred' }
    }
  }
  
  /**
   * Get all streaks for a user
   */
  async getStreaks(userId: string): Promise<Streak[]> {
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching streaks:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error in getStreaks:', error)
      return []
    }
  }
  
  /**
   * Create a new streak with AI-generated background
   */
  async createStreak(
    userId: string,
    topic: string,
    description?: string,
    targetCount?: number,
    partnerId?: string
  ): Promise<{ success: boolean; streak?: Streak; error?: string }> {
    try {
      // Generate background using AI
      let backgroundColors: string[] | null = null
      let backgroundStyle: string | null = null
      
      const aiResult = await geminiAI.generateBackground(userId, topic, 'gradient')
      if (aiResult.success && aiResult.data) {
        backgroundColors = aiResult.data.colors
        backgroundStyle = aiResult.data.style
      }
      
      const { data, error } = await supabase
        .from('streaks')
        .insert({
          user_id: userId,
          partner_id: partnerId || null,
          topic,
          description: description || null,
          background_colors: backgroundColors,
          background_style: backgroundStyle,
          current_count: 0,
          longest_count: 0,
          target_count: targetCount || null,
          is_active: true,
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating streak:', error)
        return { success: false, error: 'Failed to create streak' }
      }
      
      return { success: true, streak: data }
    } catch (error) {
      console.error('Error in createStreak:', error)
      return { success: false, error: 'An error occurred' }
    }
  }
  
  /**
   * Check in for a streak
   */
  async checkInStreak(
    userId: string,
    streakId: string
  ): Promise<{ success: boolean; streak?: Streak; error?: string }> {
    try {
      // Get the streak
      const { data: existing, error: fetchError } = await supabase
        .from('streaks')
        .select('*')
        .eq('id', streakId)
        .eq('user_id', userId)
        .single()
      
      if (fetchError || !existing) {
        return { success: false, error: 'Streak not found' }
      }
      
      const today = new Date().toISOString().split('T')[0]
      
      // Check if already checked in today
      if (existing.last_checked_date === today) {
        return { success: false, error: 'Already checked in today!' }
      }
      
      // Calculate new count
      let newCount = 1
      if (existing.last_checked_date) {
        const lastDate = new Date(existing.last_checked_date)
        const todayDate = new Date(today)
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          newCount = existing.current_count + 1
        }
      }
      
      const longestCount = Math.max(existing.longest_count, newCount)
      
      const { data, error } = await supabase
        .from('streaks')
        .update({
          current_count: newCount,
          longest_count: longestCount,
          last_checked_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streakId)
        .select()
        .single()
      
      if (error) {
        console.error('Error checking in streak:', error)
        return { success: false, error: 'Failed to check in' }
      }
      
      return { success: true, streak: data }
    } catch (error) {
      console.error('Error in checkInStreak:', error)
      return { success: false, error: 'An error occurred' }
    }
  }
  
  /**
   * Update streak background with AI
   */
  async regenerateStreakBackground(
    userId: string,
    streakId: string
  ): Promise<{ success: boolean; colors?: string[]; error?: string }> {
    try {
      const { data: streak, error: fetchError } = await supabase
        .from('streaks')
        .select('topic')
        .eq('id', streakId)
        .eq('user_id', userId)
        .single()
      
      if (fetchError || !streak) {
        return { success: false, error: 'Streak not found' }
      }
      
      const aiResult = await geminiAI.generateBackground(userId, streak.topic, 'gradient')
      
      if (!aiResult.success || !aiResult.data) {
        return { success: false, error: aiResult.error || 'Failed to generate background' }
      }
      
      const { error: updateError } = await supabase
        .from('streaks')
        .update({
          background_colors: aiResult.data.colors,
          background_style: aiResult.data.style,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streakId)
      
      if (updateError) {
        return { success: false, error: 'Failed to update background' }
      }
      
      return { success: true, colors: aiResult.data.colors }
    } catch (error) {
      console.error('Error in regenerateStreakBackground:', error)
      return { success: false, error: 'An error occurred' }
    }
  }
  
  /**
   * Delete a streak
   */
  async deleteStreak(userId: string, streakId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('streaks')
        .update({ is_active: false })
        .eq('id', streakId)
        .eq('user_id', userId)
      
      return !error
    } catch (error) {
      console.error('Error in deleteStreak:', error)
      return false
    }
  }
}

export const punchCardService = new PunchCardService()
