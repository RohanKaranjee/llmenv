import chalk from 'chalk';
import { buildContext, formatContext } from '../core/context.js';
import type { ContextStack } from '../types/index.js';

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
  
  // Format the context for display
  const formattedContext = formatContext({
    global: context.global,
    profile: context.profile,
    project: context.project,
    pins: context.pins.map(p => p.fact)
  });
  
  // Display header
  console.log(chalk.cyan('\n📋 Current Context\n'));
  
  // Display formatted context
  console.log(formattedContext);
  
  // Display project status
  if (context.project) {
    console.log(chalk.green(`\n✓ Project: ${context.project.project}`));
  } else {
    console.log(chalk.yellow('\n⚠ No project detected in current directory'));
  }
  
  // Display active profile and pin count
  console.log(chalk.gray(`\nActive profile: ${context.profile.name}`));
  console.log(chalk.gray(`Pins: ${context.pins.length}`));
  console.log(); // Empty line for spacing
}
