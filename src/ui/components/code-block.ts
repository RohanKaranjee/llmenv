/**
 * Code block component module
 * Renders formatted code blocks
 */

import { renderBox } from './box.js'
import { applyColor, getColor } from '../core/theme.js'

export interface CodeBlockOptions {
  code: string
  language?: string
  title?: string
}

/**
 * Render a code block component
 */
export function renderCodeBlock(options: CodeBlockOptions): string {
  const { code, language, title } = options

  // Simple syntax highlighting (can be expanded)
  const highlightedCode = highlightCode(code, language)

  return renderBox(highlightedCode, {
    title: title || (language ? `Code (${language})` : 'Code'),
    borderStyle: 'single',
    padding: 1,
  })
}

/**
 * Simple syntax highlighting
 */
function highlightCode(code: string, language?: string): string {
  // Basic highlighting for common patterns
  let highlighted = code

  // Highlight strings
  highlighted = highlighted.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    return applyColor(match, getColor('string'))
  })

  // Highlight numbers
  highlighted = highlighted.replace(/\b\d+\b/g, (match) => {
    return applyColor(match, getColor('number'))
  })

  // Highlight comments
  highlighted = highlighted.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, (match) => {
    return applyColor(match, getColor('comment'))
  })

  // Highlight keywords (basic set)
  const keywords = [
    'function',
    'const',
    'let',
    'var',
    'if',
    'else',
    'for',
    'while',
    'return',
    'class',
    'import',
    'export',
    'from',
    'async',
    'await',
  ]

  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g')
    highlighted = highlighted.replace(regex, (match) => {
      return applyColor(match, getColor('keyword'))
    })
  })

  return highlighted
}
