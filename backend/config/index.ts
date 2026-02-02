/**
 * Backend Configuration
 * Centralized configuration for all backend services
 */

export const config = {
  // API Keys (loaded from environment)
  gemini: {
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
    model: 'gemini-2.0-flash-exp', // Latest Gemini model
    imageModel: 'gemini-2.0-flash-exp',
  },
  
  // Supabase config
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  
  // Rate limiting
  rateLimit: {
    maxRequestsPerMinute: 10,
    maxRequestsPerDay: 100,
  },
  
  // AI Service settings
  ai: {
    maxPromptLength: 500,
    defaultBackgroundStyle: 'gradient',
    supportedStyles: ['gradient', 'abstract', 'minimalist', 'romantic', 'nature', 'space'],
  },
}

export type Config = typeof config
