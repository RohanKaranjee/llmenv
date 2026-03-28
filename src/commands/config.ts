import inquirer from 'inquirer';
import { getSettingsPath, writeJSON, initializeConfig } from '../core/config.js';
import { ValidationError } from '../types/errors.js';
import type { AISettings } from '../types/index.js';
import { renderBox, renderHeader } from '../ui/index.js';
import { getColor, applyColor } from '../ui/core/theme.js';
import { getIcon } from '../ui/icons.js';

/**
 * Configure AI provider and API key settings.
 * 
 * Prompts the user to select an AI provider (OpenAI or Claude) and enter
 * their API key. Saves the settings to ~/.llmenv/settings.json. The API
 * key input is masked for security. Ensures the config directory exists
 * before writing settings.
 * 
 * This function can be called directly for testing or through the CLI.
 * 
 * @throws {ValidationError} If API key validation fails (empty after trim)
 * @throws {ConfigError} If file write operations fail
 * 
 * @example
 * ```typescript
 * await configCommand();
 * // User is prompted for provider and API key
 * // Settings are saved to ~/.llmenv/settings.json
 * ```
 */
export async function configCommand(): Promise<void> {
  // Ensure config directory exists
  await initializeConfig();

  // Prompt for AI provider and API key
  console.log(renderHeader({ text: 'AI Configuration', icon: getIcon('settings') as string, level: 1 }) + '\n');
  const answers = await inquirer.prompt<{
    provider: 'openai' | 'claude';
    apiKey: string;
  }>([
    {
      type: 'list',
      name: 'provider',
      message: 'Select AI provider:',
      choices: [
        { name: 'OpenAI (GPT-4)', value: 'openai' },
        { name: 'Claude (Anthropic)', value: 'claude' }
      ]
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter API key:',
      mask: '*',
      validate: (input: string) => {
        const trimmed = input.trim();
        if (trimmed.length === 0) {
          return 'API key cannot be empty';
        }
        return true;
      }
    }
  ]);

  // Validate API key is not empty (additional check after trim)
  const apiKey = answers.apiKey.trim();
  if (apiKey.length === 0) {
    throw new ValidationError('API key cannot be empty', 'apiKey');
  }

  // Build settings object
  const settings: AISettings = {
    provider: answers.provider,
    apiKey: apiKey
  };

  // Write settings to ~/.llmenv/settings.json
  const settingsPath = getSettingsPath();
  await writeJSON(settingsPath, settings);

  // Display confirmation message
  const details = [
    applyColor(`Provider: ${settings.provider}`, getColor('textBright')),
    applyColor(`Settings saved to: ${settingsPath}`, getColor('textMuted'))
  ].join('\n');

  const successBox = renderBox(details, {
    title: `${getIcon('success')} Configuration Saved`,
    borderStyle: 'rounded',
    borderColor: getColor('success'),
    padding: 1
  });
  
  console.log('\n' + successBox + '\n');
}
