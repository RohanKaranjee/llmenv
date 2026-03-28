/**
 * Gradient utility for terminal output
 * Applies truecolor or fallback gradients to text
 */

import { detectCapabilities } from './core/terminal.js';

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a hex color string (e.g., "#FF0000" or "FF0000") into RGB values.
 */
function parseHex(hex: string): RGB | null {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return null;

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

/**
 * Interpolate between two RGB colors.
 * @param start Start color
 * @param end End color
 * @param factor Interpolation factor (0 to 1)
 */
function interpolateColor(start: RGB, end: RGB, factor: number): RGB {
  return {
    r: Math.round(start.r + (end.r - start.r) * factor),
    g: Math.round(start.g + (end.g - start.g) * factor),
    b: Math.round(start.b + (end.b - start.b) * factor)
  };
}

/**
 * Get ANSI Truecolor string for a given RGB color.
 */
function toTruecolorStr(rgb: RGB): string {
  return `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m`;
}

/**
 * Apply a color gradient from startColor to endColor across the given text.
 * Skips formatting if terminal does not support true color.
 *
 * @param text The text to format
 * @param startHex Start color in hex (e.g., "#00D9FF")
 * @param endHex End color in hex (e.g., "#7C3AED")
 */
export function applyGradient(text: string, startHex: string, endHex: string): string {
  const capabilities = detectCapabilities();

  // If no truecolor support or color disabled, return plain text
  if (capabilities.noColor || capabilities.colorSupport !== 'truecolor') {
    return text;
  }

  const startRGB = parseHex(startHex);
  const endRGB = parseHex(endHex);

  if (!startRGB || !endRGB) return text;

  // Split into lines to maintain alignment and avoid applying color to newlines
  const lines = text.split('\n');
  const result: string[] = [];
  
  // Calculate total non-whitespace characters for overall gradient progression
  let totalChars = 0;
  for (const line of lines) {
    totalChars += line.length;
  }

  if (totalChars === 0) return text;

  let currentCharIndex = 0;

  for (const line of lines) {
    let coloredLine = '';
    for (const char of line) {
      if (char === ' ') {
        coloredLine += char;
        currentCharIndex++;
        continue;
      }
      const factor = totalChars > 1 ? currentCharIndex / (totalChars - 1) : 0;
      const rgb = interpolateColor(startRGB, endRGB, factor);
      coloredLine += `${toTruecolorStr(rgb)}${char}\x1b[0m`;
      currentCharIndex++;
    }
    result.push(coloredLine);
  }

  return result.join('\n');
}
