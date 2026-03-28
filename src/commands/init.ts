import inquirer from 'inquirer';
import path from 'path';
import { fileExists, writeJSON } from '../core/config.js';
import { registerProject } from '../core/projects.js';
import { ValidationError, ConfigError } from '../types/errors.js';
import type { ProjectConfig } from '../types/index.js';
import ora from 'ora';
import { renderBox } from '../ui/components/box.js';
import { getColor, applyColor } from '../ui/core/theme.js';

/**
 * Initialize a new llmenv project in the current directory.
 * 
 * Prompts the user for project configuration (name, stack, technologies to avoid,
 * context, and priorities) and creates a .llmenv file in the current directory.
 * Also registers the project in the global registry at ~/.llmenv/projects.json.
 * 
 * Throws an error if a .llmenv file already exists in the directory.
 * 
 * @param cwd - Current working directory where .llmenv will be created (defaults to process.cwd())
 * @throws {ValidationError} If project name validation fails (empty after trim)
 * @throws {ConfigError} If .llmenv already exists or file operations fail
 * 
 * @example
 * ```typescript
 * await initCommand('/home/user/projects/my-app');
 * // User is prompted for project details
 * // .llmenv file is created in the specified directory
 * // Project is registered in ~/.llmenv/projects.json
 * ```
 */
export async function initCommand(cwd: string = process.cwd()): Promise<void> {
  // Check if .llmenv already exists
  const llmenvPath = path.join(cwd, '.llmenv');
  if (await fileExists(llmenvPath)) {
    throw new ConfigError(
      'A .llmenv file already exists in this directory. Remove it first if you want to reinitialize.',
      llmenvPath
    );
  }

  // Prompt for project configuration
  const answers = await inquirer.prompt<{
    project: string;
    stack: string;
    avoid: string;
    context: string;
    priorities: string;
  }>([
    {
      type: 'input',
      name: 'project',
      message: 'Project name:',
      validate: (input: string) => {
        const trimmed = input.trim();
        if (trimmed.length === 0) {
          return 'Project name cannot be empty';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'stack',
      message: 'Stack (comma-separated):',
      default: ''
    },
    {
      type: 'input',
      name: 'avoid',
      message: 'Technologies to avoid (comma-separated):',
      default: ''
    },
    {
      type: 'input',
      name: 'context',
      message: 'Project context:',
      default: ''
    },
    {
      type: 'input',
      name: 'priorities',
      message: 'Priorities (comma-separated):',
      default: ''
    }
  ]);

  // Validate project name is not empty (additional check after trim)
  const projectName = answers.project.trim();
  if (projectName.length === 0) {
    throw new ValidationError('Project name cannot be empty', 'project');
  }

  // Parse comma-separated inputs into arrays
  const parseCommaSeparated = (input: string): string[] => {
    if (!input || input.trim().length === 0) {
      return [];
    }
    return input
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  // Build project configuration
  const config: ProjectConfig = {
    project: projectName,
    stack: parseCommaSeparated(answers.stack),
    avoid: parseCommaSeparated(answers.avoid),
    context: answers.context.trim(),
    priorities: parseCommaSeparated(answers.priorities)
  };

  const spinner = ora('Initializing project...').start();

  try {
    // Write .llmenv file
    await writeJSON(llmenvPath, config);

    // Register project in global registry
    await registerProject(cwd, config);
    
    spinner.succeed('Project initialized successfully');
    
    const details = [
      applyColor('Project: ', getColor('textBright')) + config.project,
      applyColor('Stack: ', getColor('textBright')) + (config.stack.length ? config.stack.join(', ') : 'None'),
      applyColor('Context: ', getColor('textBright')) + (config.context || 'None')
    ].join('\n');
    
    console.log('\n' + renderBox(details, {
      title: 'Project Settings',
      borderStyle: 'rounded',
      borderColor: getColor('success'),
      padding: 1
    }) + '\n');
  } catch (error) {
    spinner.fail('Failed to initialize project');
    throw error;
  }
}
