/**
 * Google Gemini AI Service
 * Secure AI service for background generation and other AI features
 */

import { config } from '../config'
import { aiRateLimiter, backgroundGenerationLimiter } from '../utils/rate-limiter'
import { sanitizeString, validateAIPrompt } from '../utils/validation'

// Gemini API base URL
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export interface AIResponse<T> {
  success: boolean
  data?: T
  error?: string
  rateLimitRemaining?: number
}

export interface GeneratedBackground {
  colors: string[] // Array of hex colors for gradient
  style: string
  prompt: string
}

export interface AIGeneratedText {
  text: string
  prompt: string
}

export interface AIImageAnalysis {
  description: string
  mood: string
  suggestedCaption: string
}

/**
 * GeminiAIService - Main AI service class
 * Uses Google Gemini for text generation and analysis
 */
export class GeminiAIService {
  private apiKey: string
  private model: string
  
  constructor() {
    this.apiKey = config.gemini.apiKey
    this.model = config.gemini.model
  }
  
  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }
  
  /**
   * Make a request to Gemini API
   */
  private async makeRequest(prompt: string): Promise<string | null> {
    if (!this.isConfigured()) {
      console.warn('Gemini API key not configured')
      return null
    }
    
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
              topP: 0.9,
              topK: 40,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('Gemini API error:', errorData)
        return null
      }
      
      const data = await response.json()
      
      // Extract text from response
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      return text || null
    } catch (error) {
      console.error('Gemini API request failed:', error)
      return null
    }
  }
  
  /**
   * Generate a background gradient based on a topic/theme
   */
  async generateBackground(
    userId: string,
    topic: string,
    style: string = 'gradient'
  ): Promise<AIResponse<GeneratedBackground>> {
    // Validate input
    const validation = validateAIPrompt(topic)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }
    
    // Check rate limit
    const rateLimit = await backgroundGenerationLimiter.checkLimit(userId)
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetAt)
      return {
        success: false,
        error: `Rate limit exceeded. Try again after ${resetDate.toLocaleTimeString()}`,
        rateLimitRemaining: 0
      }
    }
    
    const sanitizedTopic = sanitizeString(topic)
    
    const prompt = `Generate a beautiful color palette for a mobile app background related to "${sanitizedTopic}" with a ${style} style.
    
The background should evoke feelings of love, connection, and warmth suitable for a couples/relationship app.

Return ONLY a JSON object in this exact format, no other text:
{
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "style": "${style}",
  "mood": "brief mood description"
}

The colors array should have 3-5 gradient colors that blend well together.`

    const response = await this.makeRequest(prompt)
    
    if (!response) {
      return { success: false, error: 'Failed to generate background' }
    }
    
    try {
      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { success: false, error: 'Invalid response format' }
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate colors
      if (!Array.isArray(parsed.colors) || parsed.colors.length < 2) {
        return { success: false, error: 'Invalid color palette' }
      }
      
      // Increment rate limit counter
      await backgroundGenerationLimiter.increment(userId)
      
      return {
        success: true,
        data: {
          colors: parsed.colors,
          style: parsed.style || style,
          prompt: sanitizedTopic
        },
        rateLimitRemaining: rateLimit.remaining - 1
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      return { success: false, error: 'Failed to parse response' }
    }
  }
  
  /**
   * Generate a love message or quote
   */
  async generateLoveMessage(
    userId: string,
    context: string = 'general'
  ): Promise<AIResponse<AIGeneratedText>> {
    // Check rate limit
    const rateLimit = await aiRateLimiter.checkLimit(userId)
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimitRemaining: 0
      }
    }
    
    const sanitizedContext = sanitizeString(context)
    
    const prompt = `Generate a short, sweet, and heartfelt love message for a couple in a long-distance relationship.
Context: ${sanitizedContext}

Keep it under 100 words. Make it personal, warm, and romantic.
Return ONLY the message text, no quotes or formatting.`

    const response = await this.makeRequest(prompt)
    
    if (!response) {
      return { success: false, error: 'Failed to generate message' }
    }
    
    await aiRateLimiter.increment(userId)
    
    return {
      success: true,
      data: {
        text: response.trim(),
        prompt: sanitizedContext
      },
      rateLimitRemaining: rateLimit.remaining - 1
    }
  }
  
  /**
   * Generate streak ideas based on topic
   */
  async generateStreakIdeas(
    userId: string,
    category: string
  ): Promise<AIResponse<string[]>> {
    const rateLimit = await aiRateLimiter.checkLimit(userId)
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimitRemaining: 0
      }
    }
    
    const sanitizedCategory = sanitizeString(category)
    
    const prompt = `Generate 5 creative streak ideas for couples related to "${sanitizedCategory}".
These are daily activities or habits couples can do together despite distance.

Return ONLY a JSON array of strings:
["idea1", "idea2", "idea3", "idea4", "idea5"]

Each idea should be:
- Simple and achievable daily
- Suitable for long-distance couples
- Fun and romantic`

    const response = await this.makeRequest(prompt)
    
    if (!response) {
      return { success: false, error: 'Failed to generate ideas' }
    }
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return { success: false, error: 'Invalid response format' }
      }
      
      const ideas = JSON.parse(jsonMatch[0])
      
      await aiRateLimiter.increment(userId)
      
      return {
        success: true,
        data: ideas,
        rateLimitRemaining: rateLimit.remaining - 1
      }
    } catch {
      return { success: false, error: 'Failed to parse response' }
    }
  }
  
  /**
   * Analyze an image and suggest caption
   */
  async analyzeImage(
    userId: string,
    imageDescription: string
  ): Promise<AIResponse<AIImageAnalysis>> {
    const rateLimit = await aiRateLimiter.checkLimit(userId)
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimitRemaining: 0
      }
    }
    
    const sanitized = sanitizeString(imageDescription, 200)
    
    const prompt = `Based on this image description: "${sanitized}"

Generate a romantic caption and mood analysis for a couples app.

Return ONLY JSON in this format:
{
  "description": "brief description",
  "mood": "mood word",
  "suggestedCaption": "romantic caption under 50 words"
}`

    const response = await this.makeRequest(prompt)
    
    if (!response) {
      return { success: false, error: 'Failed to analyze image' }
    }
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { success: false, error: 'Invalid response format' }
      }
      
      const analysis = JSON.parse(jsonMatch[0])
      
      await aiRateLimiter.increment(userId)
      
      return {
        success: true,
        data: analysis,
        rateLimitRemaining: rateLimit.remaining - 1
      }
    } catch {
      return { success: false, error: 'Failed to parse response' }
    }
  }
  
  /**
   * Generate custom response for any prompt (general purpose)
   */
  async chat(
    userId: string,
    prompt: string,
    systemContext: string = 'You are a helpful assistant for a couples/relationship app. Keep responses warm, supportive, and appropriate.'
  ): Promise<AIResponse<string>> {
    const validation = validateAIPrompt(prompt)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }
    
    const rateLimit = await aiRateLimiter.checkLimit(userId)
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimitRemaining: 0
      }
    }
    
    const sanitized = sanitizeString(prompt)
    const fullPrompt = `${systemContext}\n\nUser: ${sanitized}`
    
    const response = await this.makeRequest(fullPrompt)
    
    if (!response) {
      return { success: false, error: 'Failed to get response' }
    }
    
    await aiRateLimiter.increment(userId)
    
    return {
      success: true,
      data: response.trim(),
      rateLimitRemaining: rateLimit.remaining - 1
    }
  }
}

// Export singleton instance
export const geminiAI = new GeminiAIService()
