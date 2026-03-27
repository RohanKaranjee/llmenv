import chalk from 'chalk';
import ora from 'ora';
import { buildContext, formatContext } from '../core/context.js';
import { callAI } from '../core/ai-client.js';
import { getSettingsPath, readJSON, fileExists } from '../core/config.js';
import { ConfigError } from '../types/errors.js';
import type { AISettings } from '../types/index.js';

/**
 * Inject command: wrap user prompt with context and either display (dry run) or send to AI API.
 * 
 * Builds the complete context stack (global identity, profile, project, pins) and
 * wraps the user's prompt with context delimiters. In dry run mode (--dry flag),
 * outputs the wrapped prompt to stdout. In live mode, sends the wrapped prompt to
 * the configured AI provider and displays the response.
 * 
 * @param prompt - User's prompt text to wrap with context
 * @param options - Command options including dry flag for dry run mode
 * @param cwd - Current working directory for context building (defaults to process.cwd())
 * @throws {ConfigError} If AI settings are missing when not in dry mode or file operations fail
 * @throws {APIError} If AI API call fails in live mode
 * 
 * @example
 * ```typescript
 * // Dry run - just display wrapped prompt
 * await injectCommand('How should I structure my API?', { dry: true });
 * 
 * // Live mode - send to AI and display response
 * await injectCommand('How should I structure my API?', {});
 * ```
 */
export async function injectCommand(
  prompt: string,
  options: { dry?: boolean },
  cwd: string = process.cwd()
): Promise<void> {
  // Build the complete context stack
  const context = await buildContext(cwd);
  
  // Format the context with delimiters
  const formattedContext = formatContext({
    global: context.global,
    profile: context.profile,
    project: context.project,
    pins: context.pins.map(p => p.fact)
  });
  
  // Append user prompt after [END CONTEXT]
  const wrappedPrompt = `${formattedContext}\n\n${prompt}`;
  
  // Dry run: output to stdout without API call
  if (options.dry) {
    console.log(wrappedPrompt);
    return;
  }
  
  // Live API call: read settings and call AI
  const settingsPath = getSettingsPath();
  
  // Check if settings file exists
  if (!(await fileExists(settingsPath))) {
    throw new ConfigError(
      "Run 'llmenv config' first to set up AI provider",
      settingsPath
    );
  }
  
  // Read AI settings
  const settings = await readJSON<AISettings>(settingsPath);
  
  // Display loading spinner
  const spinner = ora('Calling AI...').start();
  
  try {
    // Call AI API with wrapped prompt
    const response = await callAI(wrappedPrompt, settings);
    
    // Stop spinner
    spinner.succeed('Response received');
    
    // Display AI response
    console.log(chalk.cyan('\n📝 AI Response\n'));
    console.log(response.content);
    console.log();
    
    // Display usage information if available
    if (response.usage) {
      console.log(chalk.gray(`Model: ${response.model}`));
      console.log(chalk.gray(`Tokens: ${response.usage.totalTokens} (${response.usage.promptTokens} prompt + ${response.usage.completionTokens} completion)`));
      console.log();
    }
  } catch (error) {
    // Stop spinner with failure
    spinner.fail('API call failed');
    
    // Re-throw error for error handler
    throw error;
  }
}
