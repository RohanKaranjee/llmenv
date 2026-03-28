/**
 * Header component module
 * Renders section headers with optional icons and decorations
 */

import { applyColor, getColor } from '../core/theme.js'
import { getResponsiveWidth } from '../core/layout.js'

export interface HeaderOptions {
  text: string
  icon?: string
  level?: 1 | 2 | 3
  color?: string
  underline?: boolean
}

/**
 * Render a header component
 */
export function renderHeader(options: HeaderOptions): string {
  const { text, icon, level = 1, color, underline = true } = options

  const result: string[] = []

  // Build header text
  let headerText = ''

  if (icon) {
    headerText += icon + ' '
  }

  headerText += text

  // Apply color
  const headerColor = color || (level === 1 ? getColor('primary') : getColor('textBright'))
  const coloredHeader = applyColor(headerText, headerColor)

  result.push(coloredHeader)

  // Add underline
  if (underline) {
    const underlineChar = level === 1 ? '═' : '─'
    const underlineLength = Math.min(text.length + (icon ? 2 : 0), getResponsiveWidth())
    const underlineColor = color || getColor('border')
    result.push(applyColor(underlineChar.repeat(underlineLength), underlineColor))
  }

  return result.join('\n')
}
