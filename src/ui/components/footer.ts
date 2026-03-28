/**
 * Footer component module
 * Renders footers with metadata and shortcuts
 */

import { applyColor, getColor } from '../core/theme.js'

export interface FooterOptions {
  text: string
  muted?: boolean
}

/**
 * Render a footer component
 */
export function renderFooter(options: FooterOptions): string {
  const { text, muted = true } = options

  const color = muted ? getColor('textMuted') : getColor('text')
  return applyColor(text, color)
}
