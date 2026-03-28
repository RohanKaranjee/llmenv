/**
 * Icon system module
 * Provides consistent icons with ASCII fallbacks
 */

import { supportsUnicode } from './core/terminal.js'

export interface IconSet {
  // Status icons
  success: string
  error: string
  warning: string
  info: string

  // Entity icons
  project: string
  profile: string
  pin: string
  history: string
  ai: string

  // UI icons
  loading: string[]
  time: string
  settings: string
  folder: string
  file: string

  // Navigation icons
  arrowUp: string
  arrowDown: string
  arrowLeft: string
  arrowRight: string
}

// Unicode icon set
const unicodeIcons: IconSet = {
  // Status icons
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',

  // Entity icons
  project: '📁',
  profile: '👤',
  pin: '📌',
  history: '📜',
  ai: '🤖',

  // UI icons
  loading: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  time: '🕐',
  settings: '⚙',
  folder: '📂',
  file: '📄',

  // Navigation icons
  arrowUp: '↑',
  arrowDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
}

// ASCII fallback icon set
const asciiIcons: IconSet = {
  // Status icons
  success: '[OK]',
  error: '[X]',
  warning: '[!]',
  info: '[i]',

  // Entity icons
  project: '[P]',
  profile: '[U]',
  pin: '[*]',
  history: '[H]',
  ai: '[AI]',

  // UI icons
  loading: ['|', '/', '-', '\\'],
  time: '[T]',
  settings: '[S]',
  folder: '[D]',
  file: '[F]',

  // Navigation icons
  arrowUp: '^',
  arrowDown: 'v',
  arrowLeft: '<',
  arrowRight: '>',
}

let iconsDisabled = false

/**
 * Get icon by name
 * Returns Unicode icon if supported, otherwise ASCII fallback
 */
export function getIcon(name: keyof IconSet): string | string[] {
  // Check if icons are disabled via environment variable
  if (process.env.LLMENV_NO_ICONS !== undefined || iconsDisabled) {
    const ascii = asciiIcons[name]
    return Array.isArray(ascii) ? ascii[0] : ascii
  }

  const iconSet = supportsUnicode() ? unicodeIcons : asciiIcons
  return iconSet[name]
}

/**
 * Get complete icon set
 * Returns Unicode icons if supported, otherwise ASCII fallback
 */
export function getIconSet(): IconSet {
  // Check if icons are disabled via environment variable
  if (process.env.LLMENV_NO_ICONS !== undefined || iconsDisabled) {
    return asciiIcons
  }

  return supportsUnicode() ? unicodeIcons : asciiIcons
}

/**
 * Disable icons (useful for testing or user preference)
 */
export function disableIcons(): void {
  iconsDisabled = true
}

/**
 * Enable icons
 */
export function enableIcons(): void {
  iconsDisabled = false
}

/**
 * Check if icons are enabled
 */
export function areIconsEnabled(): boolean {
  return !iconsDisabled && process.env.LLMENV_NO_ICONS === undefined
}
