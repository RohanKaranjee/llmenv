/**
 * Panel component module
 * Renders side-by-side panels
 */

import { getTerminalWidth } from '../core/terminal.js'

export interface PanelOptions {
  left: string
  right: string
  ratio?: number // 0-1, default 0.5 (50/50 split)
}

/**
 * Render a panel component with side-by-side layout
 */
export function renderPanel(options: PanelOptions): string {
  const { left, right, ratio = 0.5 } = options

  const terminalWidth = getTerminalWidth()
  const leftWidth = Math.floor(terminalWidth * ratio)
  const rightWidth = terminalWidth - leftWidth - 1 // -1 for separator

  const leftLines = left.split('\n')
  const rightLines = right.split('\n')
  const maxLines = Math.max(leftLines.length, rightLines.length)

  const result: string[] = []

  for (let i = 0; i < maxLines; i++) {
    const leftLine = (leftLines[i] || '').padEnd(leftWidth)
    const rightLine = rightLines[i] || ''
    result.push(`${leftLine} ${rightLine}`)
  }

  return result.join('\n')
}
