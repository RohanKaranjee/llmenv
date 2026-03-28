/**
 * Spinner component module
 * Renders animated loading indicators
 */

import { applyColor, getColor } from '../core/theme.js'
import { getIcon } from '../icons.js'

export interface SpinnerOptions {
  text?: string
  style?: 'dots' | 'line' | 'arc' | 'arrow'
}

const spinnerStyles: Record<string, string[]> = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['|', '/', '-', '\\'],
  arc: ['◜', '◠', '◝', '◞', '◡', '◟'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
}

export class Spinner {
  private frames: string[]
  private currentFrame: number = 0
  private text: string
  private interval: NodeJS.Timeout | null = null
  private isRunning: boolean = false

  constructor(options: SpinnerOptions = {}) {
    const style = options.style || 'dots'
    this.frames = spinnerStyles[style] || (getIcon('loading') as string[])
    this.text = options.text || ''
  }

  /**
   * Start the spinner animation
   */
  start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.render()

    this.interval = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length
      this.render()
    }, 80)
  }

  /**
   * Update spinner text
   */
  update(text: string): void {
    this.text = text
    if (this.isRunning) {
      this.render()
    }
  }

  /**
   * Stop spinner with success message
   */
  succeed(text?: string): void {
    this.stop()
    const successIcon = getIcon('success')
    const message = text || this.text
    console.log(applyColor(`${successIcon} ${message}`, getColor('success')))
  }

  /**
   * Stop spinner with failure message
   */
  fail(text?: string): void {
    this.stop()
    const errorIcon = getIcon('error')
    const message = text || this.text
    console.log(applyColor(`${errorIcon} ${message}`, getColor('error')))
  }

  /**
   * Stop the spinner
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.isRunning = false
    this.clearLine()
  }

  /**
   * Render current frame
   */
  private render(): void {
    this.clearLine()
    const frame = this.frames[this.currentFrame]
    const output = applyColor(`${frame} ${this.text}`, getColor('info'))
    process.stdout.write(output)
  }

  /**
   * Clear current line
   */
  private clearLine(): void {
    process.stdout.write('\r\x1b[K')
  }
}

/**
 * Create a new spinner
 */
export function createSpinner(options?: SpinnerOptions): Spinner {
  return new Spinner(options)
}
