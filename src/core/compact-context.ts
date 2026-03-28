import type { MergedContext } from '../types/index.js';

/**
 * Format the merged context in an ultra-compact format optimized for low token usage.
 * 
 * This is the KILLER FEATURE of llmenv. Every AI IDE reads rules files on every
 * single message. If we dump 500 tokens of context, users burn 500 tokens per turn.
 * 
 * Compact format: ~60-80 tokens (vs. 400+ for verbose)
 * 
 * Example output:
 * ```
 * [LLMENV] Dev: Rohan | Frontend Dev | 3yr
 * Stack: React, Vite, TailwindCSS, TS
 * Avoid: class components, plain CSS
 * Pins: dark mode + neon accents, mobile-first
 * Profile: build → ship fast, production code
 * Project: Portfolio → modern hiring portfolio
 * ```
 */
export function formatCompactContext(context: MergedContext): string {
  const lines: string[] = [];

  // Line 1: Identity (most compact possible)
  const expShort = context.global.experience
    .replace(/ years?/i, 'yr')
    .replace(/ months?/i, 'mo');
  lines.push(`[LLMENV] Dev: ${context.global.name} | ${context.global.role} | ${expShort}`);

  // Line 2: Tech stack (from preferences + project stack merged, deduped)
  const allStack = new Set<string>([
    ...context.global.preferences,
    ...(context.project?.stack || [])
  ]);
  if (allStack.size > 0) {
    lines.push(`Stack: ${[...allStack].join(', ')}`);
  }

  // Line 3: Avoid list (from project config)
  if (context.project?.avoid && context.project.avoid.length > 0) {
    lines.push(`Avoid: ${context.project.avoid.join(', ')}`);
  }

  // Line 4: Communication style (shortened)
  if (context.global.communication) {
    lines.push(`Style: ${context.global.communication}`);
  }

  // Line 5: Profile summary
  lines.push(`Profile: ${context.profile.name} → ${context.profile.focus}`);

  // Line 6: Constraints from profile
  if (context.profile.constraints && context.profile.constraints.length > 0) {
    lines.push(`Rules: ${context.profile.constraints.join(', ')}`);
  }

  // Line 7: Project summary
  if (context.project) {
    const projectLine = context.project.context
      ? `Project: ${context.project.project} → ${context.project.context}`
      : `Project: ${context.project.project}`;
    lines.push(projectLine);

    if (context.project.priorities && context.project.priorities.length > 0) {
      lines.push(`Priority: ${context.project.priorities.join(', ')}`);
    }
  }

  // Line 8: Pins (compressed into single line)
  if (context.pins && context.pins.length > 0) {
    lines.push(`Pins: ${context.pins.join(' | ')}`);
  }

  return lines.join('\n');
}

/**
 * Estimate token count for a given string.
 * Uses the simple heuristic: 1 token ≈ 4 characters (for English text).
 * This is approximate but sufficient for comparison purposes.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
