/**
 * Box component module
 * Renders bordered containers with optional title and padding
 */

import { applyColor, getColor } from '../core/theme.js'
import { wrapText, getVisibleLength, padText, getResponsiveWidth } from '../core/layout.js'
import { supportsUnicode } from '../core/terminal.js'

export interface BoxOptions {
  title?: string
  borderStyle?: 'single' | 'double' | 'rounded' | 'bold'
  borderColor?: string
  padding?: number
  width?: number
  align?: 'left' | 'center' | 'right'
}

interface BorderChars {
  tl: string // top-left
  tr: string // top-right
  bl: string // bottom-left
  br: string // bottom-right
  h: string // horizontal
  v: string // vertical
}

// Unicode border characters
const unicodeBorderChars: Record<string, BorderChars> = {
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  bold: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
}

// ASCII fallback border characters
const asciiBorderChars: Record<string, BorderChars> = {
  single: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
  double: { tl: '+', tr: '+', bl: '+', br: '+', h: '=', v: '|' },
  rounded: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
  bold: { tl: '+', tr: '+', bl: '+', br: '+', h: '=', v: '|' },
}

/**
 * Render a box component
 */
export function renderBox(content: string, options: BoxOptions = {}): string {
  const {
    title,
    borderStyle = 'single',
    borderColor,
    padding = 1,
    width,
    align = 'left',
  } = options

  // Get border characters based on Unicode support
  const borderChars = supportsUnicode()
    ? unicodeBorderChars[borderStyle]
    : asciiBorderChars[borderStyle]

  // Determine box width
  const boxWidth = width ? width : getResponsiveWidth()
  const contentWidth = boxWidth - 2 - padding * 2 // Account for borders and padding

  if (contentWidth <= 0) {
    return content // Terminal too narrow, return plain content
  }

  // Wrap content to fit within box
  const lines = content.split('\n').flatMap((line) => wrapText(line, contentWidth))

  // Apply border color
  const coloredBorder = (char: string) => {
    if (borderColor) {
      return applyColor(char, borderColor)
    }
    return applyColor(char, getColor('border'))
  }

  // Build box
  const result: string[] = []

  // Top border with optional title
  if (title) {
    const titleText = ` ${title} `
    const titleLength = getVisibleLength(titleText)
    const remainingWidth = boxWidth - 2 - titleLength

    if (remainingWidth > 0) {
      const leftBorder = borderChars.h.repeat(1)
      const rightBorder = borderChars.h.repeat(remainingWidth)
      result.push(
        coloredBorder(borderChars.tl) +
          coloredBorder(leftBorder) +
          applyColor(titleText, getColor('textBright')) +
          coloredBorder(rightBorder) +
          coloredBorder(borderChars.tr)
      )
    } else {
      // Title too long, use simple top border
      result.push(
        coloredBorder(borderChars.tl) +
          coloredBorder(borderChars.h.repeat(boxWidth - 2)) +
          coloredBorder(borderChars.tr)
      )
    }
  } else {
    result.push(
      coloredBorder(borderChars.tl) +
        coloredBorder(borderChars.h.repeat(boxWidth - 2)) +
        coloredBorder(borderChars.tr)
    )
  }

  // Top padding
  for (let i = 0; i < padding; i++) {
    result.push(coloredBorder(borderChars.v) + ' '.repeat(boxWidth - 2) + coloredBorder(borderChars.v))
  }

  // Content lines
  for (const line of lines) {
    const paddedLine = padText(line, contentWidth, align)
    const leftPadding = ' '.repeat(padding)
    const rightPadding = ' '.repeat(padding)
    result.push(
      coloredBorder(borderChars.v) + leftPadding + paddedLine + rightPadding + coloredBorder(borderChars.v)
    )
  }

  // Bottom padding
  for (let i = 0; i < padding; i++) {
    result.push(coloredBorder(borderChars.v) + ' '.repeat(boxWidth - 2) + coloredBorder(borderChars.v))
  }

  // Bottom border
  result.push(
    coloredBorder(borderChars.bl) +
      coloredBorder(borderChars.h.repeat(boxWidth - 2)) +
      coloredBorder(borderChars.br)
  )

  return result.join('\n')
}
