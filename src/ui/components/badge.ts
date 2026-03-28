/**
 * Badge component module
 * Renders small status indicators with color and icon
 */

import { applyColor, getColor } from '../core/theme.js'

export interface BadgeOptions {
  text: string
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default'
  icon?: string
}

/**
 * Render a badge component
 */
export function renderBadge(options: BadgeOptions): string {
  const { text, variant = 'default', icon } = options

  // Get color based on variant
  let color: string
  switch (variant) {
    case 'success':
      color = getColor('success')
      break
    case 'error':
      color = getColor('error')
      break
    case 'warning':
      color = getColor('warning')
      break
    case 'info':
      color = getColor('info')
      break
    default:
      color = getColor('text')
  }

  // Build badge text
  let badgeText = ''

  if (icon) {
    badgeText += icon + ' '
  }

  badgeText += text

  return applyColor(badgeText, color)
}
