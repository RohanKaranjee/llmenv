/**
 * Timeline component module
 * Renders chronological data in a vertical timeline format
 */

import { applyColor, getColor } from '../core/theme.js'
import { wrapText } from '../core/layout.js'

export interface TimelineEntry {
  timestamp: string
  title: string
  content: string
  icon?: string
  color?: string
}

export interface TimelineOptions {
  entries: TimelineEntry[]
  showConnectors?: boolean
}

/**
 * Render a timeline component
 */
export function renderTimeline(options: TimelineOptions): string {
  const { entries, showConnectors = true } = options

  const result: string[] = []

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1

    // Bullet point
    const bullet = entry.icon || '●'
    const bulletColor = entry.color || getColor('primary')
    const coloredBullet = applyColor(bullet, bulletColor)

    // Timestamp and title
    const timestamp = applyColor(entry.timestamp, getColor('textMuted'))
    const title = applyColor(entry.title, getColor('textBright'))
    result.push(`  ${coloredBullet}  ${timestamp}  ${title}`)

    // Content lines
    const contentLines = entry.content.split('\n')
    contentLines.forEach((line) => {
      const wrapped = wrapText(line, 70)
      wrapped.forEach((wrappedLine) => {
        const connector = showConnectors && !isLast ? '│' : ' '
        const coloredConnector = applyColor(connector, getColor('border'))
        result.push(`  ${coloredConnector}  ${applyColor(wrappedLine, getColor('text'))}`)
      })
    })

    // Add spacing between entries
    if (!isLast) {
      const connector = showConnectors ? '│' : ' '
      const coloredConnector = applyColor(connector, getColor('border'))
      result.push(`  ${coloredConnector}`)
    }
  })

  return result.join('\n')
}
