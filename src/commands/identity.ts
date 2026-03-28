import inquirer from 'inquirer';
import { getDefaultConfigPath, writeJSON, readJSON, fileExists, initializeConfig } from '../core/config.js';
import type { GlobalIdentity } from '../types/index.js';
import { renderBox, renderHeader } from '../ui/index.js';
import { getColor, applyColor } from '../ui/core/theme.js';
import { getIcon } from '../ui/icons.js';
import { syncCommand } from './sync.js';

/**
 * Interactive command to set up or update the user's global identity.
 * 
 * Prompts for name, role, experience, preferences, and communication style.
 * Pre-fills existing values from ~/.llmenv/default.json if available.
 * Saves the updated identity back to ~/.llmenv/default.json.
 */
export async function identityCommand(options: { github?: string } = {}): Promise<void> {
  await initializeConfig();

  console.log(renderHeader({
    text: 'Global Identity Setup',
    icon: getIcon('profile') as string,
    level: 1,
    color: getColor('primary')
  }) + '\n');

  console.log(applyColor('  This information is injected into every AI interaction so tools', getColor('textMuted')));
  console.log(applyColor('  know who you are and how you like to work.\n', getColor('textMuted')));

  const configPath = getDefaultConfigPath();
  let existing: Partial<GlobalIdentity> = {};

  if (await fileExists(configPath)) {
    try {
      existing = await readJSON<GlobalIdentity>(configPath);
    } catch {}
  }

  let identity: GlobalIdentity;

  if (options.github) {
    console.log(applyColor(`  Fetching profile for @${options.github} from GitHub...`, getColor('info')));
    try {
      // Very basic fetch via Node 18+ native fetch
      const res = await fetch(`https://api.github.com/users/${options.github}`);
      if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
      const data = await res.json() as any;

      identity = {
        name: data.name || data.login || 'Unknown',
        role: data.bio || 'Developer',
        experience: 'GitHub verified',
        preferences: ['GitHub'],
        communication: existing.communication || 'Direct, technical, with examples'
      };
      console.log(applyColor('  ✓ GitHub data fetched successfully.\n', getColor('success')));
    } catch (err: any) {
      console.log(applyColor(`  Failed to fetch GitHub profile: ${err.message}`, getColor('error')));
      return;
    }
  } else {
    // Normal prompt
    const answers = await inquirer.prompt<{
    name: string;
    role: string;
    experience: string;
    preferences: string;
    communication: string;
  }>([
    {
      type: 'input',
      name: 'name',
      message: 'Your name:',
      default: existing.name !== 'Your Name' ? existing.name : undefined,
      validate: (input: string) => input.trim().length > 0 || 'Name cannot be empty'
    },
    {
      type: 'input',
      name: 'role',
      message: 'Your role (e.g., Frontend Developer, Full Stack Dev):',
      default: existing.role !== 'Developer' ? existing.role : undefined,
      validate: (input: string) => input.trim().length > 0 || 'Role cannot be empty'
    },
    {
      type: 'input',
      name: 'experience',
      message: 'Experience level (e.g., 3 years, Senior, Student):',
      default: existing.experience !== 'X years' ? existing.experience : undefined,
      validate: (input: string) => input.trim().length > 0 || 'Experience cannot be empty'
    },
    {
      type: 'input',
      name: 'preferences',
      message: 'Tech preferences (comma-separated, e.g., React, TypeScript, TailwindCSS):',
      default: existing.preferences?.join(', '),
      validate: (input: string) => input.trim().length > 0 || 'Enter at least one preference'
    },
    {
      type: 'input',
      name: 'communication',
      message: 'How should AI respond? (e.g., Direct, with code examples):',
      default: existing.communication,
      validate: (input: string) => input.trim().length > 0 || 'Communication style cannot be empty'
    }
  ]);

  identity = {
      name: answers.name.trim(),
      role: answers.role.trim(),
      experience: answers.experience.trim(),
      preferences: answers.preferences.split(',').map(s => s.trim()).filter(s => s.length > 0),
      communication: answers.communication.trim()
    };
  }

  // Save to ~/.llmenv/default.json
  await writeJSON(configPath, identity);

  // Display success
  const details = [
    applyColor('Name: ', getColor('textBright')) + identity.name,
    applyColor('Role: ', getColor('textBright')) + identity.role,
    applyColor('Experience: ', getColor('textBright')) + identity.experience,
    applyColor('Preferences: ', getColor('textBright')) + identity.preferences.join(', '),
    applyColor('Communication: ', getColor('textBright')) + identity.communication
  ].join('\n');

  const successBox = renderBox(details, {
    title: `${getIcon('success')} Identity Saved`,
    borderStyle: 'rounded',
    borderColor: getColor('success'),
    padding: 1
  });

  console.log('\n' + successBox + '\n');

  // Auto-sync silently
  try {
    await syncCommand({ verbose: false, silent: true });
  } catch (err) {}
}
