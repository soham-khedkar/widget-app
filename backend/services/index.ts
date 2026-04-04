/**
 * Backend Services Export
 * Central export for all backend services
 */

export { GeminiAIService, geminiAI } from './gemini-ai'
export type { AIGeneratedText, AIImageAnalysis, AIResponse, GeneratedBackground } from './gemini-ai'

export { PunchCardService, punchCardService } from './punch-card'
export type { PunchCard, PunchCardStats, Streak } from './punch-card'

