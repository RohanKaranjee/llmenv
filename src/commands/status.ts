import { buildContext } from '../core/context.js';
import type { ContextStack } from '../types/index.js';
import { formatStatus } from '../utils/formatters.js';
import { renderBanner } from '../ui/components/banner.js';

/**
 * Display the current merged context including global identity, active profile,
 * project configuration (if detected), and pinned facts.
 *
 * Builds the complete context stack and displays it in a formatted view. Shows:
 * - Global identity details
 * - Project name if detected, warning if not
 * - Active profile details
 * - Pinned facts summary
 *
 * @param cwd - Current working directory for context building (defaults to process.cwd())
 * @throws {ConfigError} If required configuration files are missing or contain invalid JSON
 *
 * @example
 * ```typescript
 * await statusCommand();
 * // Output:
 * // [banner]
 * // [Global Identity box]
 * // [Active Profile box]
 * // [Current Project box]
 * // [Pinned Facts box]
 * ```
 */
export async function statusCommand(cwd: string = process.cwd()): Promise<void> {
  // Build the complete context stack
  const context: ContextStack = await buildContext(cwd);

  // Display banner
  console.log(renderBanner());

  // Format the context for display using the rich UI components
  // We map the ContextStack to MergedContext structure required by formatStatus
  const mergedContext = {
    global: context.global,
    profile: context.profile,
    project: context.project,
    pins: context.pins.map(p => p.fact)
  };

  const formattedStatus = formatStatus(mergedContext);

  // Display formatted context
  console.log(formattedStatus);
  console.log(); // Empty line for spacing
}
