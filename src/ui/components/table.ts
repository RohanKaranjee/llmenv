/**
 * Table component module
 * Renders tabular data with headers, borders, and alignment
 */

import { applyColor, getColor } from '../core/theme.js'
import { calculateColumnWidths, padText, truncateText, getVisibleLength, getResponsiveWidth, isTerminalTooNarrow } from '../core/layout.js'
import { supportsUnicode } from '../core/terminal.js'

export interface Column {
  header: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
  flex?: number
}

export interface TableOptions {
  columns: Column[]
  data: Record<string, any>[]
  borderStyle?: 'single' | 'double' | 'rounded' | 'none'
  headerColor?: string
  alternateRows?: boolean
  highlightRow?: (row: Record<string, any>) => boolean
}

interface BorderChars {
  tl: string
  tr: string
  bl: string
  br: string
  h: string
  v: string
  cross: string
  tJoin: string
  bJoin: string
  lJoin: string
  rJoin: string
}

const unicodeBorderChars: Record<string, BorderChars> = {
  single: {
    tl: '┌',
    tr: '┐',
    bl: '└',
    br: '┘',
    h: '─',
    v: '│',
    cross: '┼',
    tJoin: '┬',
    bJoin: '┴',
    lJoin: '├',
    rJoin: '┤',
  },
  double: {
    tl: '╔',
    tr: '╗',
    bl: '╚',
    br: '╝',
    h: '═',
    v: '║',
    cross: '╬',
    tJoin: '╦',
    bJoin: '╩',
    lJoin: '╠',
    rJoin: '╣',
  },
  rounded: {
    tl: '╭',
    tr: '╮',
    bl: '╰',
    br: '╯',
    h: '─',
    v: '│',
    cross: '┼',
    tJoin: '┬',
    bJoin: '┴',
    lJoin: '├',
    rJoin: '┤',
  },
}

const asciiBorderChars: BorderChars = {
  tl: '+',
  tr: '+',
  bl: '+',
  br: '+',
  h: '-',
  v: '|',
  cross: '+',
  tJoin: '+',
  bJoin: '+',
  lJoin: '+',
  rJoin: '+',
}

/**
 * Render a table component
 */
export function renderTable(options: TableOptions): string {
  const {
    columns,
    data,
    borderStyle = 'single',
    headerColor,
    alternateRows = false,
    highlightRow,
  } = options

  // Check if terminal is too narrow for horizontal layout
  const minWidth = columns.length * 10 + columns.length + 1
  if (isTerminalTooNarrow(minWidth)) {
    return renderVerticalTable(columns, data)
  }

  // Get border characters
  const borderChars =
    borderStyle === 'none'
      ? null
      : supportsUnicode()
      ? unicodeBorderChars[borderStyle]
      : asciiBorderChars

  // Calculate column widths
  const terminalWidth = getResponsiveWidth()
  const availableWidth = borderChars ? terminalWidth - (columns.length + 1) : terminalWidth - columns.length
  const columnWidths = calculateColumnWidths(
    columns.map((col) => ({
      minWidth: Math.max(getVisibleLength(col.header), col.width || 10),
      maxWidth: col.width,
      flex: col.flex || 1,
    })),
    availableWidth
  )

  const result: string[] = []

  // Top border
  if (borderChars) {
    const line =
      borderChars.tl +
      columnWidths.map((w) => borderChars.h.repeat(w)).join(borderChars.tJoin) +
      borderChars.tr
    result.push(applyColor(line, getColor('border')))
  }

  // Header row
  const headerCells = columns.map((col, i) => {
    const text = truncateText(col.header, columnWidths[i])
    const padded = padText(text, columnWidths[i], col.align || 'left')
    return headerColor ? applyColor(padded, headerColor) : applyColor(padded, getColor('textBright'))
  })

  if (borderChars) {
    result.push(
      applyColor(borderChars.v, getColor('border')) +
        headerCells.join(applyColor(borderChars.v, getColor('border'))) +
        applyColor(borderChars.v, getColor('border'))
    )
  } else {
    result.push(headerCells.join(' '))
  }

  // Header separator
  if (borderChars) {
    const line =
      borderChars.lJoin +
      columnWidths.map((w) => borderChars.h.repeat(w)).join(borderChars.cross) +
      borderChars.rJoin
    result.push(applyColor(line, getColor('border')))
  }

  // Data rows
  data.forEach((row, rowIndex) => {
    const cells = columns.map((col, i) => {
      const value = row[col.key]
      const text = value !== undefined && value !== null ? String(value) : ''
      const truncated = truncateText(text, columnWidths[i])
      return padText(truncated, columnWidths[i], col.align || 'left')
    })

    // Apply row highlighting or alternating colors
    const isHighlighted = highlightRow && highlightRow(row)
    const rowColor = isHighlighted
      ? getColor('highlight')
      : alternateRows && rowIndex % 2 === 1
      ? getColor('textMuted')
      : getColor('text')

    const coloredCells = cells.map((cell) => applyColor(cell, rowColor))

    if (borderChars) {
      result.push(
        applyColor(borderChars.v, getColor('border')) +
          coloredCells.join(applyColor(borderChars.v, getColor('border'))) +
          applyColor(borderChars.v, getColor('border'))
      )
    } else {
      result.push(coloredCells.join(' '))
    }
  })

  // Bottom border
  if (borderChars) {
    const line =
      borderChars.bl +
      columnWidths.map((w) => borderChars.h.repeat(w)).join(borderChars.bJoin) +
      borderChars.br
    result.push(applyColor(line, getColor('border')))
  }

  // Footer with row count
  const footer = applyColor(`Total: ${data.length} ${data.length === 1 ? 'row' : 'rows'}`, getColor('textMuted'))
  result.push('')
  result.push(footer)

  return result.join('\n')
}

/**
 * Render table in vertical layout for narrow terminals
 */
function renderVerticalTable(columns: Column[], data: Record<string, any>[]): string {
  const result: string[] = []

  data.forEach((row, index) => {
    if (index > 0) {
      result.push('')
      result.push(applyColor('─'.repeat(40), getColor('border')))
      result.push('')
    }

    columns.forEach((col) => {
      const value = row[col.key]
      const text = value !== undefined && value !== null ? String(value) : ''
      result.push(
        applyColor(col.header + ': ', getColor('textBright')) + applyColor(text, getColor('text'))
      )
    })
  })

  // Footer
  result.push('')
  result.push(applyColor(`Total: ${data.length} ${data.length === 1 ? 'row' : 'rows'}`, getColor('textMuted')))

  return result.join('\n')
}
