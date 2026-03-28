import { buildContext } from '../core/context.js';
import type { ContextStack } from '../types/index.js';
import { formatStatus } from '../utils/formatters.js';
import { renderBanner } from '../ui/components/banner.js';

/**
 * Display the current merged context including global identity, active profile,
 * project configuration (if detected), and pinned facts.
 * 
 * Builds the complete context stack and displays it in a formatted view with
 * colored headers. Shows:
 * - Formatted context with [CONTEXT] delimiters
 * - Project name if detected, warning if not
 * - Active profile name
 * - Pin count
 * 
 * @param cwd - Current working directory for context building (defaults to process.cwd())
 * @throws {ConfigError} If required configuration files are missing or contain invalid JSON
 * 
 * @example
 * ```typescript
 * await statusCommand();
 * // Output:
 * // 📋 Current Context
 * //
 * // [CONTEXT]
 * // === Global Identity ===
 * // Name: John Doe
 * // ...
 * // [END CONTEXT]
 * //
 * // ✓ Project: my-app
 * // Active profile: work
 * // Pins: 2
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
