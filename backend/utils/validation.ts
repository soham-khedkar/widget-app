/**
 * Input Validation Utilities
 * Secure validation for all backend inputs
 */

// Sanitize string input to prevent injection
export function sanitizeString(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return ''
  
  // Remove any potential script tags or malicious content
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
  
  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  return sanitized
}

// Validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Validate date format (ISO 8601)
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

// Validate positive integer
export function isPositiveInteger(value: any): boolean {
  return Number.isInteger(value) && value > 0
}

// Validate color hex code
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

// Validate AI prompt (safe content check)
export function validateAIPrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt is required' }
  }
  
  const sanitized = sanitizeString(prompt)
  
  if (sanitized.length < 3) {
    return { valid: false, error: 'Prompt too short (min 3 characters)' }
  }
  
  if (sanitized.length > 500) {
    return { valid: false, error: 'Prompt too long (max 500 characters)' }
  }
  
  // Check for potentially harmful content patterns
  const blockedPatterns = [
    /\b(hack|exploit|inject|malware|virus)\b/i,
    /\b(sql|xss|csrf)\b/i,
  ]
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(sanitized)) {
      return { valid: false, error: 'Invalid content in prompt' }
    }
  }
  
  return { valid: true }
}

// Validate streak topic
export function validateStreakTopic(topic: string): { valid: boolean; error?: string } {
  if (!topic || typeof topic !== 'string') {
    return { valid: false, error: 'Topic is required' }
  }
  
  const sanitized = sanitizeString(topic, 100)
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Topic too short (min 2 characters)' }
  }
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Topic too long (max 100 characters)' }
  }
  
  return { valid: true }
}
