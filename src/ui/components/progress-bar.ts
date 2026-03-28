/**
 * Progress bar component module
 * Renders progress bars for determinate progress
 */

import { applyColor, getColor } from '../core/theme.js'

export interface ProgressBarOptions {
  current: number
  total: number
  width?: number
  showPercentage?: boolean
}

/**
 * Render a progress bar component
 */
export function renderProgressBar(options: ProgressBarOptions): string {
  const { current, total, width = 40, showPercentage = true } = options

  const percentage = Math.min(100, Math.max(0, (current / total) * 100))
  const filledWidth = Math.floor((percentage / 100) * width)
  const emptyWidth = width - filledWidth

  const filled = '█'.repeat(filledWidth)
  const empty = '░'.repeat(emptyWidth)

  const bar = applyColor(filled, getColor('success')) + applyColor(empty, getColor('textMuted'))

  if (showPercentage) {
    const percentText = `${Math.floor(percentage)}%`
    return `${bar} ${applyColor(percentText, getColor('textBright'))}`
  }

  return bar
}
