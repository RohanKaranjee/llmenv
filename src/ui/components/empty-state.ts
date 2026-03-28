/**
 * Empty state component module
 * Renders friendly empty state messages with suggestions
 */

import { renderBox } from './box.js'
import { applyColor, getColor } from '../core/theme.js'

export interface EmptyStateOptions {
  icon?: string
  message: string
  suggestion?: string
}

/**
 * Render an empty state component
 */
export function renderEmptyState(options: EmptyStateOptions): string {
  const { icon, message, suggestion } = options

  const lines: string[] = []

  // Icon and message
  if (icon) {
    lines.push(icon + ' ' + applyColor(message, getColor('textMuted')))
  } else {
    lines.push(applyColor(message, getColor('textMuted')))
  }

  // Suggestion
  if (suggestion) {
    lines.push('')
    lines.push(applyColor(suggestion, getColor('info')))
  }

  return renderBox(lines.join('\n'), {
    borderStyle: 'rounded',
    padding: 2,
  })
}
