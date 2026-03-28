/**
 * Terminal capability detection module
 * Detects terminal capabilities and provides capability-aware utilities
 */

export interface TerminalCapabilities {
  colorSupport: 'none' | '8' | '16' | '256' | 'truecolor'
  unicodeSupport: boolean
  width: number
  height: number
  noColor: boolean
}

let cachedCapabilities: TerminalCapabilities | null = null

/**
 * Detect terminal capabilities
 * Results are cached for performance
 */
export function detectCapabilities(): TerminalCapabilities {
  if (cachedCapabilities) {
    return cachedCapabilities
  }

  const capabilities: TerminalCapabilities = {
    colorSupport: detectColorSupport(),
    unicodeSupport: detectUnicodeSupport(),
    width: getTerminalWidth(),
    height: getTerminalHeight(),
    noColor: isColorDisabled(),
  }

  cachedCapabilities = capabilities
  return capabilities
}

/**
 * Get terminal width in columns
 */
export function getTerminalWidth(): number {
  return process.stdout.columns || 80
}

/**
 * Get terminal height in rows
 */
export function getTerminalHeight(): number {
  return process.stdout.rows || 24
}

/**
 * Check if terminal supports color
 */
export function supportsColor(): boolean {
  const colorSupport = detectColorSupport()
  return colorSupport !== 'none'
}

/**
 * Check if terminal supports Unicode
 */
export function supportsUnicode(): boolean {
  return detectUnicodeSupport()
}

/**
 * Check if color is disabled via NO_COLOR environment variable
 */
export function isColorDisabled(): boolean {
  return process.env.NO_COLOR !== undefined
}

/**
 * Detect color support level
 */
function detectColorSupport(): 'none' | '8' | '16' | '256' | 'truecolor' {
  // Check if output is a TTY
  if (!process.stdout.isTTY) {
    return 'none'
  }

  // Check NO_COLOR environment variable
  if (process.env.NO_COLOR !== undefined) {
    return 'none'
  }

  // Check for truecolor support
  if (process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '24bit') {
    return 'truecolor'
  }

  // Check TERM environment variable
  const term = process.env.TERM || ''

  if (term.includes('256color')) {
    return '256'
  }

  if (term.includes('color')) {
    return '16'
  }

  // Check for basic color support
  if (term === 'dumb') {
    return 'none'
  }

  // Default to 16 colors for TTY
  return '16'
}

/**
 * Detect Unicode support
 */
function detectUnicodeSupport(): boolean {
  // Check if output is a TTY
  if (!process.stdout.isTTY) {
    return false
  }

  // Check LANG and LC_ALL environment variables
  const lang = process.env.LANG || process.env.LC_ALL || ''

  // UTF-8 encoding indicates Unicode support
  if (lang.toLowerCase().includes('utf-8') || lang.toLowerCase().includes('utf8')) {
    return true
  }

  // Windows Terminal and modern terminals support Unicode
  if (process.platform === 'win32') {
    return process.env.WT_SESSION !== undefined || process.env.TERM_PROGRAM === 'vscode'
  }

  // Default to true for modern terminals
  return true
}

/**
 * Clear cached capabilities (useful for testing)
 */
export function clearCache(): void {
  cachedCapabilities = null
}
