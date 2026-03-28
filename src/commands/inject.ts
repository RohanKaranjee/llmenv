import ora from 'ora';
import { buildContext, formatContext } from '../core/context.js';
import { callAI } from '../core/ai-client.js';
import { getSettingsPath, readJSON, fileExists } from '../core/config.js';
import { ConfigError } from '../types/errors.js';
import type { AISettings } from '../types/index.js';
import { renderBox, renderHeader } from '../ui/index.js';
import { getColor, applyColor } from '../ui/core/theme.js';
import { getIcon } from '../ui/icons.js';

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
  
  // Live API call: read settings and call AI
  const settingsPath = getSettingsPath();
  let isDryRun = options.dry;
  let settings: AISettings | undefined;

  // Check if settings file exists, if not fallback to dry run
  if (!isDryRun) {
    if (!(await fileExists(settingsPath))) {
      isDryRun = true;
      console.log(applyColor('⚠ No AI provider configured. Falling back to dry run.', getColor('warning')));
      console.log(applyColor('Run "llmenv config" to set up an API key.\n', getColor('textMuted')));
    } else {
      settings = await readJSON<AISettings>(settingsPath);
    }
  }
  
  // Dry run: output to stdout without API call
  if (isDryRun) {
    const box = renderBox(wrappedPrompt, {
      title: `${getIcon('file')} Context-Wrapped Prompt (Copy below)`,
      borderStyle: 'rounded',
      borderColor: getColor('info'),
      padding: 1
    });
    console.log('\n' + box + '\n');
    return;
  }
  
  // Display loading spinner
  const spinner = ora('Calling AI...').start();
  
  try {
    // Call AI API with wrapped prompt
    // settings is guaranteed to be defined here due to the check above
    const response = await callAI(wrappedPrompt, settings!);
    
    // Stop spinner
    spinner.succeed('Response received');
    
    // Display AI response
    console.log('\n' + renderHeader({ 
      text: 'AI Response', 
      icon: getIcon('ai') as string, 
      level: 1, 
      color: getColor('primary') 
    }) + '\n');
    
    const responseBox = renderBox(response.content, {
      borderStyle: 'rounded',
      borderColor: getColor('primary'),
      padding: 1
    });
    console.log(responseBox + '\n');
    
    // Display usage information if available
    if (response.usage) {
      const usageInfo = [
        applyColor(`Model: ${response.model}`, getColor('textMuted')),
        applyColor(`Tokens: ${response.usage.totalTokens} (${response.usage.promptTokens} prompt + ${response.usage.completionTokens} completion)`, getColor('textMuted'))
      ].join('\n');
      console.log(usageInfo + '\n');
    }
  } catch (error) {
    // Stop spinner with failure
    spinner.fail('API call failed');
    
    // Re-throw error for error handler
    throw error;
  }
}
