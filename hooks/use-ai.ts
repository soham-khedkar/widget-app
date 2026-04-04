/**
 * AI Service Hook
 * Provides access to Gemini AI features throughout the app
 */

import type { AIImageAnalysis, GeneratedBackground } from '@/backend/services'
import { geminiAI } from '@/backend/services'
import { useCallback, useState } from 'react'
import { useAuthContext } from './use-auth-context'

interface UseAIReturn {
  // State
  loading: boolean
  error: string | null
  rateLimitRemaining: number | null
  
  // Actions
  generateBackground: (topic: string, style?: string) => Promise<GeneratedBackground | null>
  generateLoveMessage: (context?: string) => Promise<string | null>
  generateStreakIdeas: (category: string) => Promise<string[] | null>
  analyzeImage: (description: string) => Promise<AIImageAnalysis | null>
  chat: (prompt: string) => Promise<string | null>
  
  // Status
  isConfigured: boolean
}

export function useAI(): UseAIReturn {
  const { session } = useAuthContext()
  const userId = session?.user?.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null)
  
  const isConfigured = geminiAI.isConfigured()
  
  const handleResult = <T>(
    result: { success: boolean; data?: T; error?: string; rateLimitRemaining?: number }
  ): T | null => {
    if (result.rateLimitRemaining !== undefined) {
      setRateLimitRemaining(result.rateLimitRemaining)
    }
    
    if (result.success && result.data) {
      setError(null)
      return result.data
    }
    
    setError(result.error || 'An error occurred')
    return null
  }
  
  const generateBackground = useCallback(
    async (topic: string, style = 'gradient'): Promise<GeneratedBackground | null> => {
      if (!userId) {
        setError('Not authenticated')
        return null
      }
      
      setLoading(true)
      setError(null)
      
      try {
        const result = await geminiAI.generateBackground(userId, topic, style)
        return handleResult(result)
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )
  
  const generateLoveMessage = useCallback(
    async (context = 'general'): Promise<string | null> => {
      if (!userId) {
        setError('Not authenticated')
        return null
      }
      
      setLoading(true)
      setError(null)
      
      try {
        const result = await geminiAI.generateLoveMessage(userId, context)
        return handleResult(result)?.text || null
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )
  
  const generateStreakIdeas = useCallback(
    async (category: string): Promise<string[] | null> => {
      if (!userId) {
        setError('Not authenticated')
        return null
      }
      
      setLoading(true)
      setError(null)
      
      try {
        const result = await geminiAI.generateStreakIdeas(userId, category)
        return handleResult(result)
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )
  
  const analyzeImage = useCallback(
    async (description: string): Promise<AIImageAnalysis | null> => {
      if (!userId) {
        setError('Not authenticated')
        return null
      }
      
      setLoading(true)
      setError(null)
      
      try {
        const result = await geminiAI.analyzeImage(userId, description)
        return handleResult(result)
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )
  
  const chat = useCallback(
    async (prompt: string): Promise<string | null> => {
      if (!userId) {
        setError('Not authenticated')
        return null
      }
      
      setLoading(true)
      setError(null)
      
      try {
        const result = await geminiAI.chat(userId, prompt)
        return handleResult(result)
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )
  
  return {
    loading,
    error,
    rateLimitRemaining,
    generateBackground,
    generateLoveMessage,
    generateStreakIdeas,
    analyzeImage,
    chat,
    isConfigured,
  }
}
