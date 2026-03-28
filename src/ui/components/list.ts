/**
 * List component module
 * Renders vertical lists with icons and formatting
 */

import { applyColor, getColor } from '../core/theme.js'

export interface ListItem {
  icon?: string
  text: string
  subtext?: string
  color?: string
}

export interface ListOptions {
  items: ListItem[]
  numbered?: boolean
  indent?: number
  spacing?: number
}

/**
 * Render a list component
 */
export function renderList(options: ListOptions): string {
  const { items, numbered = false, indent = 0, spacing = 0 } = options

  const result: string[] = []
  const indentStr = ' '.repeat(indent)

  items.forEach((item, index) => {
    const lines: string[] = []

    // Build main line
    let mainLine = indentStr

    // Add number or bullet
    if (numbered) {
      mainLine += applyColor(`${index + 1}. `, getColor('textBright'))
    }

    // Add icon
    if (item.icon) {
      mainLine += item.icon + ' '
    }

    // Add text
    const textColor = item.color || getColor('text')
    mainLine += applyColor(item.text, textColor)

    lines.push(mainLine)

    // Add subtext if present
    if (item.subtext) {
      const subtextIndent = indentStr + '   ' // Extra indent for subtext
      lines.push(subtextIndent + applyColor(item.subtext, getColor('textMuted')))
    }

    result.push(...lines)

    // Add spacing between items
    for (let i = 0; i < spacing; i++) {
      result.push('')
    }
  })

  return result.join('\n')
}
