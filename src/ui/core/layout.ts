/**
 * Layout engine module
 * Handles text wrapping, column width calculation, and responsive layouts
 */

import { getTerminalWidth } from './terminal.js'

export interface LayoutOptions {
  width?: number
  padding?: number
  margin?: number
  align?: 'left' | 'center' | 'right'
}

/**
 * Calculate column widths for a table
 * Uses flex-box-like algorithm to distribute available width
 */
export function calculateColumnWidths(
  columns: Array<{ minWidth: number; maxWidth?: number; flex?: number }>,
  availableWidth: number
): number[] {
  const widths: number[] = []
  let remainingWidth = availableWidth

  // First pass: assign minimum widths
  for (const column of columns) {
    widths.push(column.minWidth)
    remainingWidth -= column.minWidth
  }

  // If no remaining width, return minimum widths
  if (remainingWidth <= 0) {
    return widths
  }

  // Second pass: distribute remaining width based on flex values
  const totalFlex = columns.reduce((sum, col) => sum + (col.flex || 1), 0)

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i]
    const flex = column.flex || 1
    const additionalWidth = Math.floor((remainingWidth * flex) / totalFlex)

    // Apply max width constraint if specified
    if (column.maxWidth) {
      widths[i] = Math.min(widths[i] + additionalWidth, column.maxWidth)
    } else {
      widths[i] += additionalWidth
    }
  }

  return widths
}

/**
 * Wrap text to fit within specified width
 * Respects word boundaries
 */
export function wrapText(text: string, width: number): string[] {
  if (width <= 0) {
    return [text]
  }

  const lines: string[] = []
  const words = text.split(' ')
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const visibleLength = getVisibleLength(testLine)

    if (visibleLength <= width) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
      }

      // If single word is longer than width, split it
      if (getVisibleLength(word) > width) {
        const chunks = splitLongWord(word, width)
        lines.push(...chunks.slice(0, -1))
        currentLine = chunks[chunks.length - 1]
      } else {
        currentLine = word
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : ['']
}

/**
 * Split a long word into chunks that fit within width
 */
function splitLongWord(word: string, width: number): string[] {
  const chunks: string[] = []
  let currentChunk = ''

  for (const char of word) {
    if (getVisibleLength(currentChunk + char) <= width) {
      currentChunk += char
    } else {
      if (currentChunk) {
        chunks.push(currentChunk)
      }
      currentChunk = char
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks.length > 0 ? chunks : [word]
}

/**
 * Truncate text to fit within max width with ellipsis
 */
export function truncateText(text: string, maxWidth: number, ellipsis: string = '...'): string {
  const visibleLength = getVisibleLength(text)

  if (visibleLength <= maxWidth) {
    return text
  }

  const ellipsisLength = ellipsis.length
  const targetLength = maxWidth - ellipsisLength

  if (targetLength <= 0) {
    return ellipsis.substring(0, maxWidth)
  }

  // Strip ANSI codes for accurate truncation
  const stripped = stripAnsi(text)
  let truncated = ''
  let currentLength = 0

  for (const char of stripped) {
    if (currentLength >= targetLength) {
      break
    }
    truncated += char
    currentLength++
  }

  return truncated + ellipsis
}

/**
 * Pad text to specified width with alignment
 */
export function padText(text: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string {
  const visibleLength = getVisibleLength(text)

  if (visibleLength >= width) {
    return text
  }

  const padding = width - visibleLength

  if (align === 'left') {
    return text + ' '.repeat(padding)
  }

  if (align === 'right') {
    return ' '.repeat(padding) + text
  }

  // Center alignment
  const leftPadding = Math.floor(padding / 2)
  const rightPadding = padding - leftPadding
  return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding)
}

/**
 * Strip ANSI escape codes from text
 */
export function stripAnsi(text: string): string {
  // ANSI escape code regex
  const ansiRegex = /\x1b\[[0-9;]*m/g
  return text.replace(ansiRegex, '')
}

/**
 * Get visible length of text (excluding ANSI codes)
 */
export function getVisibleLength(text: string): number {
  return stripAnsi(text).length
}

/**
 * Create a horizontal line of specified width
 */
export function createLine(width: number, char: string = '─'): string {
  return char.repeat(width)
}

/**
 * Check if terminal is too narrow for horizontal layout
 */
export function isTerminalTooNarrow(minWidth: number): boolean {
  const terminalWidth = getTerminalWidth()
  return terminalWidth < minWidth
}

/**
 * Get responsive width based on terminal size
 */
export function getResponsiveWidth(preferredWidth?: number): number {
  const terminalWidth = getTerminalWidth()

  if (!preferredWidth) {
    return terminalWidth
  }

  return Math.min(preferredWidth, terminalWidth)
}
