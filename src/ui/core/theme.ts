/**
 * Theme system module
 * Manages color schemes and provides semantic color access
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { detectCapabilities } from './terminal.js'

export interface ColorPalette {
  // Brand colors
  primary: string
  secondary: string

  // Semantic colors
  success: string
  error: string
  warning: string
  info: string

  // Text colors
  text: string
  textMuted: string
  textBright: string

  // UI colors
  border: string
  background: string
  highlight: string

  // Syntax colors (for code blocks)
  keyword: string
  string: string
  number: string
  comment: string
}

export interface Theme {
  name: string
  colors: ColorPalette
}

// Default theme with brand colors
const defaultTheme: Theme = {
  name: 'default',
  colors: {
    primary: '#00D9FF', // Cyan for llmenv brand
    secondary: '#7C3AED', // Purple accent

    success: '#10B981', // Green
    error: '#EF4444', // Red
    warning: '#F59E0B', // Amber
    info: '#3B82F6', // Blue

    text: '#E5E7EB', // Light gray
    textMuted: '#9CA3AF', // Medium gray
    textBright: '#FFFFFF', // White

    border: '#4B5563', // Dark gray
    background: '#1F2937', // Very dark gray
    highlight: '#374151', // Slightly lighter gray

    keyword: '#C084FC', // Purple
    string: '#34D399', // Green
    number: '#FBBF24', // Yellow
    comment: '#6B7280', // Gray
  },
}

// Minimal theme
const minimalTheme: Theme = {
  name: 'minimal',
  colors: {
    primary: '#FFFFFF',
    secondary: '#CCCCCC',

    success: '#00FF00',
    error: '#FF0000',
    warning: '#FFFF00',
    info: '#00FFFF',

    text: '#FFFFFF',
    textMuted: '#999999',
    textBright: '#FFFFFF',

    border: '#666666',
    background: '#000000',
    highlight: '#333333',

    keyword: '#FFFFFF',
    string: '#FFFFFF',
    number: '#FFFFFF',
    comment: '#666666',
  },
}

// Vibrant theme
const vibrantTheme: Theme = {
  name: 'vibrant',
  colors: {
    primary: '#FF00FF', // Magenta
    secondary: '#00FFFF', // Cyan

    success: '#00FF00', // Bright green
    error: '#FF0000', // Bright red
    warning: '#FFAA00', // Orange
    info: '#0088FF', // Bright blue

    text: '#FFFFFF',
    textMuted: '#AAAAAA',
    textBright: '#FFFFFF',

    border: '#FF00FF',
    background: '#000000',
    highlight: '#330033',

    keyword: '#FF00FF',
    string: '#00FF00',
    number: '#FFAA00',
    comment: '#666666',
  },
}

// Monochrome theme
const monochromeTheme: Theme = {
  name: 'monochrome',
  colors: {
    primary: '#FFFFFF',
    secondary: '#CCCCCC',

    success: '#FFFFFF',
    error: '#FFFFFF',
    warning: '#FFFFFF',
    info: '#FFFFFF',

    text: '#FFFFFF',
    textMuted: '#999999',
    textBright: '#FFFFFF',

    border: '#FFFFFF',
    background: '#000000',
    highlight: '#333333',

    keyword: '#FFFFFF',
    string: '#FFFFFF',
    number: '#FFFFFF',
    comment: '#666666',
  },
}

const builtInThemes: Record<string, Theme> = {
  default: defaultTheme,
  minimal: minimalTheme,
  vibrant: vibrantTheme,
  monochrome: monochromeTheme,
}

let currentTheme: Theme = defaultTheme

/**
 * Load theme by name or from custom theme file
 */
export function loadTheme(name?: string): Theme {
  // If no name provided, try to load custom theme
  if (!name) {
    const customTheme = loadCustomTheme()
    if (customTheme) {
      currentTheme = customTheme
      return customTheme
    }
    currentTheme = defaultTheme
    return defaultTheme
  }

  // Check built-in themes
  if (builtInThemes[name]) {
    currentTheme = builtInThemes[name]
    return currentTheme
  }

  // Theme not found, fall back to default
  console.warn(`Theme "${name}" not found, using default theme`)
  currentTheme = defaultTheme
  return defaultTheme
}

/**
 * Load custom theme from ~/.llmenv/theme.json
 */
function loadCustomTheme(): Theme | null {
  try {
    const themePath = join(homedir(), '.llmenv', 'theme.json')

    if (!existsSync(themePath)) {
      return null
    }

    const themeData = readFileSync(themePath, 'utf-8')
    const theme = JSON.parse(themeData) as Theme

    // Validate theme structure
    if (!validateTheme(theme)) {
      console.warn('Invalid theme file, using default theme')
      return null
    }

    return theme
  } catch (error) {
    console.warn('Failed to load custom theme:', (error as Error).message)
    return null
  }
}

/**
 * Validate theme structure
 */
function validateTheme(theme: any): theme is Theme {
  if (!theme || typeof theme !== 'object') {
    return false
  }

  if (!theme.name || typeof theme.name !== 'string') {
    return false
  }

  if (!theme.colors || typeof theme.colors !== 'object') {
    return false
  }

  const requiredColors: (keyof ColorPalette)[] = [
    'primary',
    'secondary',
    'success',
    'error',
    'warning',
    'info',
    'text',
    'textMuted',
    'textBright',
    'border',
    'background',
    'highlight',
    'keyword',
    'string',
    'number',
    'comment',
  ]

  for (const color of requiredColors) {
    if (!theme.colors[color] || typeof theme.colors[color] !== 'string') {
      return false
    }
  }

  return true
}

/**
 * Get color by semantic name
 */
export function getColor(semantic: keyof ColorPalette): string {
  const capabilities = detectCapabilities()

  // If colors are disabled, return empty string
  if (capabilities.noColor || capabilities.colorSupport === 'none') {
    return ''
  }

  return currentTheme.colors[semantic]
}

/**
 * Apply color to text using ANSI escape codes
 */
export function applyColor(text: string, color: string): string {
  const capabilities = detectCapabilities()

  // If colors are disabled, return plain text
  if (capabilities.noColor || capabilities.colorSupport === 'none') {
    return text
  }

  // If color is empty, return plain text
  if (!color) {
    return text
  }

  // Convert hex color to ANSI escape code
  const ansiCode = hexToAnsi(color, capabilities.colorSupport)

  if (!ansiCode) {
    return text
  }

  return `${ansiCode}${text}\x1b[0m`
}

/**
 * Convert hex color to ANSI escape code based on terminal capabilities
 */
function hexToAnsi(hex: string, colorSupport: 'none' | '8' | '16' | '256' | 'truecolor'): string | null {
  if (colorSupport === 'none') {
    return null
  }

  // Remove # if present
  hex = hex.replace('#', '')

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null
  }

  // Truecolor support (24-bit)
  if (colorSupport === 'truecolor') {
    return `\x1b[38;2;${r};${g};${b}m`
  }

  // 256 color support
  if (colorSupport === '256') {
    const code = rgbTo256(r, g, b)
    return `\x1b[38;5;${code}m`
  }

  // 16 color support (basic ANSI colors)
  if (colorSupport === '16' || colorSupport === '8') {
    const code = rgbTo16(r, g, b)
    return `\x1b[${code}m`
  }

  return null
}

/**
 * Convert RGB to 256 color code
 */
function rgbTo256(r: number, g: number, b: number): number {
  // Grayscale
  if (r === g && g === b) {
    if (r < 8) return 16
    if (r > 248) return 231
    return Math.round(((r - 8) / 247) * 24) + 232
  }

  // Color
  const rIndex = Math.round((r / 255) * 5)
  const gIndex = Math.round((g / 255) * 5)
  const bIndex = Math.round((b / 255) * 5)

  return 16 + 36 * rIndex + 6 * gIndex + bIndex
}

/**
 * Convert RGB to 16 color code (basic ANSI)
 */
function rgbTo16(r: number, g: number, b: number): number {
  const brightness = (r + g + b) / 3

  // Determine dominant color
  const max = Math.max(r, g, b)

  if (max === r && r > g && r > b) {
    return brightness > 128 ? 91 : 31 // Red
  }
  if (max === g && g > r && g > b) {
    return brightness > 128 ? 92 : 32 // Green
  }
  if (max === b && b > r && b > g) {
    return brightness > 128 ? 94 : 34 // Blue
  }
  if (r === g && r > b) {
    return brightness > 128 ? 93 : 33 // Yellow
  }
  if (r === b && r > g) {
    return brightness > 128 ? 95 : 35 // Magenta
  }
  if (g === b && g > r) {
    return brightness > 128 ? 96 : 36 // Cyan
  }

  // Grayscale
  return brightness > 128 ? 97 : 37 // White or gray
}

/**
 * Get current theme
 */
export function getCurrentTheme(): Theme {
  return currentTheme
}
