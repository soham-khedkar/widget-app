/**
 * Rate Limiter Utility
 * Prevents abuse of AI and other expensive operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

interface RateLimitEntry {
  count: number
  resetAt: number // timestamp
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number // time window in milliseconds
}

const RATE_LIMIT_PREFIX = '@truluv:rate_limit:'

export class RateLimiter {
  private config: RateLimitConfig
  private key: string
  
  constructor(key: string, config: RateLimitConfig) {
    this.key = `${RATE_LIMIT_PREFIX}${key}`
    this.config = config
  }
  
  /**
   * Check if the request should be allowed
   * Returns remaining requests or throws if limit exceeded
   */
  async checkLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const storageKey = `${this.key}:${userId}`
    const now = Date.now()
    
    try {
      const stored = await AsyncStorage.getItem(storageKey)
      let entry: RateLimitEntry
      
      if (stored) {
        entry = JSON.parse(stored)
        
        // Reset if window has passed
        if (now > entry.resetAt) {
          entry = {
            count: 0,
            resetAt: now + this.config.windowMs
          }
        }
      } else {
        entry = {
          count: 0,
          resetAt: now + this.config.windowMs
        }
      }
      
      const remaining = Math.max(0, this.config.maxRequests - entry.count)
      const allowed = remaining > 0
      
      return {
        allowed,
        remaining,
        resetAt: entry.resetAt
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Fail open - allow the request but log the error
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: now + this.config.windowMs
      }
    }
  }
  
  /**
   * Increment the counter after a successful request
   */
  async increment(userId: string): Promise<void> {
    const storageKey = `${this.key}:${userId}`
    const now = Date.now()
    
    try {
      const stored = await AsyncStorage.getItem(storageKey)
      let entry: RateLimitEntry
      
      if (stored) {
        entry = JSON.parse(stored)
        
        // Reset if window has passed
        if (now > entry.resetAt) {
          entry = {
            count: 1,
            resetAt: now + this.config.windowMs
          }
        } else {
          entry.count += 1
        }
      } else {
        entry = {
          count: 1,
          resetAt: now + this.config.windowMs
        }
      }
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry))
    } catch (error) {
      console.error('Rate limit increment error:', error)
    }
  }
  
  /**
   * Reset the rate limit for a user
   */
  async reset(userId: string): Promise<void> {
    const storageKey = `${this.key}:${userId}`
    try {
      await AsyncStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Rate limit reset error:', error)
    }
  }
}

// Pre-configured rate limiters
export const aiRateLimiter = new RateLimiter('ai', {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000 // 1 hour
})

export const backgroundGenerationLimiter = new RateLimiter('bg_gen', {
  maxRequests: 10,
  windowMs: 24 * 60 * 60 * 1000 // 24 hours
})
