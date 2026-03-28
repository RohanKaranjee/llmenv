/**
 * Buffered renderer module
 * Provides utilities for efficient terminal rendering
 */

export class RenderBuffer {
  private buffer: string[] = []

  /**
   * Write text to buffer without newline
   */
  write(text: string): void {
    this.buffer.push(text)
  }

  /**
   * Write text to buffer with newline
   */
  writeLine(text: string): void {
    this.buffer.push(text + '\n')
  }

  /**
   * Add a newline to buffer
   */
  newLine(): void {
    this.buffer.push('\n')
  }

  /**
   * Flush buffer and return accumulated output
   */
  flush(): string {
    const output = this.buffer.join('')
    this.clear()
    return output
  }

  /**
   * Clear buffer without returning output
   */
  clear(): void {
    this.buffer = []
  }

  /**
   * Get current buffer size
   */
  size(): number {
    return this.buffer.length
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.buffer.length === 0
  }
}

/**
 * Create a new render buffer
 */
export function createRenderer(): RenderBuffer {
  return new RenderBuffer()
}
